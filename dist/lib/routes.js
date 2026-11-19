/**
 * EN: HTTP surface for the Telegram gateway, browser settings, statistics and
 * the MCP endpoint. Every route is loopback-only for browser/MCP callers.
 * RU: HTTP-поверхность для Telegram gateway, настроек браузера, статистики и
 * MCP endpoint. Маршруты браузера/MCP доступны только с loopback.
 */
import { Buffer } from 'node:buffer';
import { historyTotals, previewText } from './store.js';
import { asrCostUsd, ttsCostUsd, estimateTokens, describeApiKey, redactError } from './deepseek.js';
import { transcribeBuffer, synthesizeVoice, SpeechError } from './speech.js';
import { handleMcpRequest, mcpStatus } from './mcp.js';
import { edgeStatus } from './edge.js';
import { installFfmpeg } from './deps.js';
const MAX_JSON = 64 * 1024;
const MAX_ASR_BODY = Math.ceil((8 * 1024 * 1024 * 4) / 3) + 64 * 1024;
function isLoopback(value) {
    const address = String(value || '').toLowerCase().replace(/^\[|\]$/g, '');
    return address === 'localhost' || address === 'localhost.' || address === '::1'
        || address.startsWith('127.') || address.startsWith('::ffff:127.');
}
function trustedBrowser(req, ctx) {
    const remote = req?.socket?.remoteAddress;
    if (isLoopback(remote))
        return true;
    const conn = ctx?.get?.('connection');
    if (conn && typeof conn.requestRejection === 'function') {
        try {
            return conn.requestRejection(req) === undefined;
        }
        catch {
            return false;
        }
    }
    return false;
}
/**
 * EN: All plugin JSON responses are non-cacheable.
 * RU: Все JSON-ответы плагина не кэшируются.
 */
function writeJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}
function readBody(req, maxBytes) {
    return new Promise((resolve, reject) => {
        const declared = Number(req.headers?.['content-length']);
        if (Number.isFinite(declared) && declared > maxBytes) {
            const err = new Error(`body too large (max ${maxBytes} bytes)`);
            err.statusCode = 413;
            reject(err);
            return;
        }
        let total = 0;
        const chunks = [];
        req.on('data', (chunk) => {
            total += chunk.length;
            if (total > maxBytes) {
                const err = new Error(`body too large (max ${maxBytes} bytes)`);
                err.statusCode = 413;
                req.destroy(err);
                reject(err);
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
async function readJson(req, maxBytes = MAX_JSON) {
    const raw = await readBody(req, maxBytes);
    if (!raw.length)
        return {};
    try {
        return JSON.parse(raw.toString('utf8'));
    }
    catch {
        throw new SpeechError('Invalid JSON body', { code: 'bad-json', status: 400 });
    }
}
/**
 * EN: Rejects unsupported methods with 405 instead of falling through.
 * RU: Отклоняет неподдерживаемые методы кодом 405, не проваливаясь дальше.
 */
function methodGuard(req, res, allowed) {
    if (req.method !== allowed) {
        writeJson(res, 405, { ok: false, error: { code: 'method', message: `${allowed} only` } });
        return false;
    }
    return true;
}
function routeError(res, err, logger) {
    const status = Number(err?.status || err?.statusCode) || 502;
    const code = err?.code || 'error';
    const message = redactError(err);
    logger?.warn?.(`deepseek-speech: ${code}: ${message}`);
    if (!res.headersSent) {
        writeJson(res, status, { ok: false, error: { code, message } });
    }
    else {
        try {
            res.end();
        }
        catch { /* best effort */ }
    }
}
function asrRecord({ started, mode, result, config }) {
    return {
        kind: 'asr',
        source: mode,
        at: Date.now(),
        status: 'ok',
        latencyMs: Date.now() - started,
        audioDurationMs: result.durationMs,
        textChars: Array.from(result.text).length,
        billedChars: 0,
        tokensEstimate: estimateTokens(result.text),
        costUsd: asrCostUsd(result.durationMs, config.asrRatePerHour),
        preview: previewText(result.text),
        requestId: result.requestIds?.[0] || null,
        chunks: result.chunks,
    };
}
function ttsRecord({ started, source, result, sessionId = null, voiceId, config }) {
    return {
        kind: 'tts',
        source,
        at: Date.now(),
        status: 'ok',
        latencyMs: Date.now() - started,
        audioDurationMs: result.durationMs,
        textChars: Array.from(result.preparedText || '').length,
        billedChars: result.provider === 'edge' ? 0 : result.billedChars,
        tokensEstimate: estimateTokens(result.preparedText || ''),
        costUsd: result.provider === 'edge' ? 0 : ttsCostUsd(result.billedChars, config.ttsRatePer10k),
        preview: previewText(result.preparedText || ''),
        voiceId,
        provider: result.provider,
        language: result.language,
        edgeVoice: result.edgeVoice,
        fallbackFrom: result.fallbackFrom,
        fallbackReason: result.fallbackReason,
        quality: result.quality,
        bitrateKbps: result.bitrateKbps,
        sessionId: sessionId || null,
        chunks: 1,
    };
}
export function registerRoutes({ ctx, config, settingsStore, history, getDeps, logger }) {
    const disposers = [];
    let asrRouteActive = false;
    let asrRouteConflict = null;
    const register = (path, handler, label) => {
        try {
            const dispose = ctx.webServer.register({ kind: 'exact', path, handler });
            disposers.push(dispose);
            return true;
        }
        catch (err) {
            logger?.warn?.(`deepseek-speech: route ${path} registration failed: ${err.message}`);
            return false;
        }
    };
    // EN: Gateway-compatible ASR route. A duplicate registration is reported,
    // not thrown, so the rest of the plugin can still start.
    // RU: ASR-маршрут, совместимый с gateway. Дубликат регистрации сообщается,
    // но не выбрасывается, чтобы остальной плагин мог запуститься.
    asrRouteActive = register('/dsh-voice/transcribe', async (req, res) => {
        if (!methodGuard(req, res, 'POST'))
            return;
        if (!isLoopback(req.socket?.remoteAddress)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'loopback only' } });
            return;
        }
        const started = Date.now();
        let mode = 'telegram';
        try {
            const payload = await readJson(req, MAX_ASR_BODY);
            mode = payload.mode === 'dictation' ? 'dictation' : 'telegram';
            const b64 = typeof payload.dataBase64 === 'string' ? payload.dataBase64 : '';
            if (!b64)
                throw new SpeechError('No audio data', { code: 'no-audio', status: 400 });
            let bytes;
            try {
                bytes = Buffer.from(b64, 'base64');
            }
            catch {
                throw new SpeechError('Invalid base64 audio', { code: 'bad-audio', status: 400 });
            }
            if (!bytes.length)
                throw new SpeechError('Empty audio', { code: 'no-audio', status: 400 });
            const key = await ctx.credentials?.resolve?.(config.apiKeyEnv);
            const apiKey = typeof key === 'string' ? key.trim() : String(key?.value || '').trim();
            if (!apiKey)
                throw new SpeechError('DeepSeek API key is not configured', { code: 'no-key', status: 503 });
            const deps = await getDeps();
            if (!deps.ok)
                throw new SpeechError('ffmpeg/ffprobe/libopus are not available', { code: 'deps-missing', status: 503 });
            const result = await transcribeBuffer({
                key: apiKey,
                config,
                deps,
                bytes,
                mimeType: payload.mimeType || 'audio/ogg',
            });
            const record = asrRecord({ started, mode, result, config });
            await history.add(record);
            writeJson(res, 200, {
                ok: true,
                text: result.text,
                provider: 'deepseek',
                duration_ms: result.durationMs,
                tookMs: result.apiMs,
                totalTookMs: Date.now() - started,
                chunks: result.chunks,
            });
        }
        catch (err) {
            const message = redactError(err);
            await history.add({
                kind: 'asr',
                source: mode,
                at: Date.now(),
                status: 'error',
                latencyMs: Date.now() - started,
                audioDurationMs: 0,
                textChars: 0,
                tokensEstimate: 0,
                costUsd: 0,
                preview: '',
                error: message,
                chunks: 1,
            }).catch(() => { });
            routeError(res, err, logger);
        }
    }, 'dsh-voice/transcribe');
    if (!asrRouteActive)
        asrRouteConflict = 'route /dsh-voice/transcribe is already registered; restart DSH after removing dsh-voice';
    register('/deepseek-speech/mcp', async (req, res) => {
        await handleMcpRequest({
            ctx,
            config,
            settingsStore,
            history,
            getDeps,
            logger,
            getRouteStatus: () => ({ active: asrRouteActive, conflict: asrRouteConflict }),
        }, req, res);
    }, 'deepseek-speech/mcp');
    register('/deepseek-speech/status', async (req, res) => {
        if (!methodGuard(req, res, 'GET'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            const [deps, key, edge, mcp] = await Promise.all([
                getDeps(),
                describeApiKey(ctx, config.apiKeyEnv),
                edgeStatus(),
                mcpStatus(),
            ]);
            const settings = settingsStore.get();
            writeJson(res, 200, {
                ok: true,
                key,
                deps,
                edge,
                mcp,
                route: { active: asrRouteActive, conflict: asrRouteConflict },
                settings,
                totals: history.totals(),
                rates: {
                    asrPerHour: config.asrRatePerHour,
                    ttsPer10k: config.ttsRatePer10k,
                },
                qualityOptions: ['64', '96', '128', '160', '192', '256', 'dynamic'],
                edgeLanguages: ['auto', 'ru', 'en'],
            });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/status');
    register('/deepseek-speech/history', async (req, res) => {
        if (!methodGuard(req, res, 'GET'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            const url = new URL(req.url || '/', 'http://127.0.0.1');
            const limit = Number(url.searchParams.get('limit')) || 100;
            writeJson(res, 200, {
                ok: true,
                entries: history.list(limit),
                totals: historyTotals(history.entries),
            });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/history');
    register('/deepseek-speech/history/clear', async (req, res) => {
        if (!methodGuard(req, res, 'POST'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            await history.clear();
            writeJson(res, 200, { ok: true, totals: history.totals() });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/history/clear');
    // EN: Key writes go only through DSH credentials; the key is never echoed.
    // RU: Запись ключа идёт только через DSH credentials; ключ никогда не возвращается.
    register('/deepseek-speech/key', async (req, res) => {
        if (!['POST', 'DELETE'].includes(req.method || '')) {
            writeJson(res, 405, { ok: false, error: { code: 'method', message: 'POST or DELETE only' } });
            return;
        }
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            if (req.method === 'DELETE') {
                await ctx.credentials.unset(config.apiKeyEnv);
                writeJson(res, 200, { ok: true, key: await describeApiKey(ctx, config.apiKeyEnv) });
                return;
            }
            const body = await readJson(req);
            const apiKey = String(body.apiKey || '').trim();
            if (!apiKey || apiKey.length > 512)
                throw new SpeechError('API key must be between 1 and 512 characters', { code: 'bad-key', status: 400 });
            await ctx.credentials.set(config.apiKeyEnv, apiKey);
            writeJson(res, 200, { ok: true, key: await describeApiKey(ctx, config.apiKeyEnv) });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/key');
    register('/deepseek-speech/settings', async (req, res) => {
        if (!methodGuard(req, res, 'POST'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            const body = await readJson(req);
            const settings = await settingsStore.update({
                alwaysVoice: body.alwaysVoice,
                voiceId: body.voiceId,
                ttsQuality: body.ttsQuality,
                ttsMaxChars: body.ttsMaxChars,
                telegramHome: body.telegramHome,
                edgeEnabled: body.edgeEnabled,
                edgeLanguage: body.edgeLanguage,
            });
            writeJson(res, 200, { ok: true, settings });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/settings');
    register('/deepseek-speech/tools/check', async (req, res) => {
        if (!methodGuard(req, res, 'POST'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            const deps = await getDeps(true);
            writeJson(res, 200, { ok: true, deps });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/tools/check');
    register('/deepseek-speech/tools/install', async (req, res) => {
        if (!methodGuard(req, res, 'POST'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        try {
            const result = await installFfmpeg(logger);
            const deps = result.ok ? await getDeps(true) : undefined;
            writeJson(res, result.ok ? 200 : 409, { ok: result.ok, ...result, deps });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/tools/install');
    // EN: Preview uses the same provider order as voice replies.
    // RU: Preview использует тот же порядок провайдеров, что и голосовые ответы.
    register('/deepseek-speech/tts/preview', async (req, res) => {
        if (!methodGuard(req, res, 'POST'))
            return;
        if (!trustedBrowser(req, ctx)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'untrusted request' } });
            return;
        }
        const started = Date.now();
        try {
            const body = await readJson(req);
            const key = await ctx.credentials?.resolve?.(config.apiKeyEnv);
            const apiKey = typeof key === 'string' ? key.trim() : String(key?.value || '').trim();
            if (!apiKey)
                throw new SpeechError('DeepSeek API key is not configured', { code: 'no-key', status: 503 });
            const deps = await getDeps();
            if (!deps.ok)
                throw new SpeechError('ffmpeg/ffprobe/libopus are not available', { code: 'deps-missing', status: 503 });
            const settings = settingsStore.get();
            const requestedVoice = body.voiceId === 'tide' ? 'tide' : (body.voiceId === 'stella' ? 'stella' : settings.voiceId);
            const result = await synthesizeVoice({
                key: apiKey,
                config: { ...config, ttsMaxChars: Math.min(Number(config.ttsMaxChars) || 4000, 1200) },
                deps,
                text: String(body.text || 'Hello from DeepSeek speech.'),
                voiceId: requestedVoice,
                quality: body.ttsQuality || settings.ttsQuality,
                edgeEnabled: body.edgeEnabled == null ? settings.edgeEnabled !== false : body.edgeEnabled !== false,
                edgeLanguage: body.edgeLanguage || settings.edgeLanguage || 'auto',
            });
            await history.add(ttsRecord({ started, source: 'preview', result, voiceId: requestedVoice, config }));
            writeJson(res, 200, {
                ok: true,
                audioBase64: result.bytes.toString('base64'),
                mime: result.mime,
                durationMs: result.durationMs,
                latencyMs: Date.now() - started,
                quality: result.quality,
                bitrateKbps: result.bitrateKbps,
                provider: result.provider,
                language: result.language,
                edgeVoice: result.edgeVoice,
                fallbackFrom: result.fallbackFrom,
                fallbackReason: result.fallbackReason,
            });
        }
        catch (err) {
            routeError(res, err, logger);
        }
    }, 'deepseek-speech/tts/preview');
    return {
        dispose() {
            for (const dispose of disposers.splice(0)) {
                try {
                    dispose();
                }
                catch { /* best effort */ }
            }
        },
        routeStatus() {
            return { active: asrRouteActive, conflict: asrRouteConflict };
        },
    };
}
