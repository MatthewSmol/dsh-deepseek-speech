/**
 * EN: MCP Streamable HTTP service. Exposes transcribe/synthesize/status/stats/
 * voices tools to DSH and external local MCP clients. The endpoint is
 * loopback-only and reuses the same stores/routes as the UI.
 * RU: MCP Streamable HTTP сервис. Отдаёт tools transcribe/synthesize/status/
 * stats/voices для DSH и внешних локальных MCP-клиентов. Endpoint доступен
 * только с loopback и использует те же хранилища/маршруты, что и UI.
 */
import { Buffer } from 'node:buffer';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { dataDir, previewText } from './store.js';
import { asrCostUsd, ttsCostUsd, estimateTokens, describeApiKey, redactError, } from './deepseek.js';
import { transcribeBuffer, synthesizeVoice } from './speech.js';
import { edgeStatus, EDGE_VOICES } from './edge.js';
let sdkPromise = null;
async function loadSdk() {
    if (!sdkPromise) {
        sdkPromise = Promise.all([
            import('@modelcontextprotocol/server'),
            import('@modelcontextprotocol/node'),
            import('zod'),
        ]).then(([server, node, zod]) => {
            if (!server?.McpServer || !node?.NodeStreamableHTTPServerTransport) {
                throw new Error('MCP SDK exports are unavailable');
            }
            return {
                McpServer: server.McpServer,
                NodeStreamableHTTPServerTransport: node.NodeStreamableHTTPServerTransport,
                z: zod.z || zod.default?.z,
            };
        }).catch((err) => {
            sdkPromise = null;
            throw new Error(`MCP SDK is not installed: ${err.message}`);
        });
    }
    return sdkPromise;
}
export async function mcpStatus() {
    try {
        await loadSdk();
        return { available: true, endpoint: '/deepseek-speech/mcp', serverName: 'deepseek_speech', error: null };
    }
    catch (err) {
        return { available: false, endpoint: '/deepseek-speech/mcp', serverName: 'deepseek_speech', error: err.message };
    }
}
/**
 * EN: Accepts IPv4/IPv6 loopback forms used by Node and proxies.
 * RU: Принимает IPv4/IPv6 loopback-формы, которые используют Node и прокси.
 */
function isLoopback(value) {
    const address = String(value || '').toLowerCase().replace(/^\[|\]$/g, '');
    return address === 'localhost' || address === 'localhost.' || address === '::1'
        || address.startsWith('127.') || address.startsWith('::ffff:127.');
}
function textResult(value) {
    return {
        content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    };
}
function normalizeVoice(value) {
    return value === 'tide' ? 'tide' : 'stella';
}
function mimeForPath(path) {
    const ext = extname(path).toLowerCase();
    if (ext === '.ogg' || ext === '.opus')
        return 'audio/ogg';
    if (ext === '.wav')
        return 'audio/wav';
    if (ext === '.mp3')
        return 'audio/mpeg';
    if (ext === '.m4a' || ext === '.mp4')
        return 'audio/mp4';
    if (ext === '.webm')
        return 'audio/webm';
    return 'application/octet-stream';
}
function makeAsrRecord({ started, result, config, source }) {
    return {
        kind: 'asr',
        source,
        at: Date.now(),
        status: 'ok',
        latencyMs: Date.now() - started,
        audioDurationMs: result.durationMs,
        textChars: Array.from(result.text).length,
        tokensEstimate: estimateTokens(result.text),
        costUsd: asrCostUsd(result.durationMs, config.asrRatePerHour),
        preview: previewText(result.text),
        requestId: result.requestIds?.[0] || null,
        chunks: result.chunks,
    };
}
/**
 * EN: Converts a TTS result into the same history shape as Telegram/UI calls.
 * RU: Преобразует результат TTS в тот же формат истории, что Telegram/UI.
 */
function makeTtsRecord({ started, result, config, source }) {
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
        provider: result.provider,
        language: result.language,
        edgeVoice: result.edgeVoice,
        fallbackFrom: result.fallbackFrom,
        fallbackReason: result.fallbackReason,
        quality: result.quality,
        bitrateKbps: result.bitrateKbps,
        chunks: 1,
    };
}
function registerTools(server, deps) {
    const { z } = deps;
    // EN: Transcribe accepts exactly one of base64 or a local audio path.
    // RU: Transcribe принимает ровно один источник: base64 или локальный аудиофайл.
    server.registerTool('transcribe_audio', {
        title: 'Transcribe audio with DeepSeek ASR',
        description: 'Transcribe an audio file or base64 audio using DeepSeek ASR. Accepts Ogg, WAV, MP3, M4A or WebM; audio is converted and split locally.',
        inputSchema: z.object({
            audioBase64: z.string().optional().describe('Base64-encoded audio bytes. Provide exactly one of audioBase64 or filePath.'),
            filePath: z.string().optional().describe('Absolute path to a local audio file. Provide exactly one of audioBase64 or filePath.'),
            mimeType: z.string().optional().describe('Optional MIME type; detected from the file extension when omitted.'),
        }),
    }, async ({ audioBase64, filePath, mimeType }) => {
        if (Boolean(audioBase64) === Boolean(filePath)) {
            throw new Error('Provide exactly one of audioBase64 or filePath');
        }
        let bytes;
        let mime = mimeType || 'audio/ogg';
        if (filePath) {
            if (!isAbsolute(filePath))
                throw new Error('filePath must be absolute');
            const info = await stat(filePath);
            if (!info.isFile())
                throw new Error('filePath is not a regular file');
            if (info.size > 8 * 1024 * 1024)
                throw new Error('Audio exceeds the 8 MiB limit');
            bytes = await readFile(filePath);
            mime = mimeType || mimeForPath(filePath);
        }
        else {
            bytes = Buffer.from(audioBase64, 'base64');
        }
        if (!bytes.length)
            throw new Error('Audio is empty');
        if (bytes.length > 8 * 1024 * 1024)
            throw new Error('Audio exceeds the 8 MiB limit');
        const resolved = await deps.ctx.credentials?.resolve?.(deps.config.apiKeyEnv);
        const key = typeof resolved === 'string' ? resolved.trim() : String(resolved?.value || '').trim();
        if (!key)
            throw new Error('DeepSeek API key is not configured');
        const started = Date.now();
        const result = await transcribeBuffer({ key, config: deps.config, deps: deps.runtimeDeps, bytes, mimeType: mime });
        await deps.history.add(makeAsrRecord({ started, result, config: deps.config, source: 'mcp' }));
        return textResult({
            text: result.text,
            durationMs: result.durationMs,
            chunks: result.chunks,
            provider: 'deepseek',
            costUsd: asrCostUsd(result.durationMs, deps.config.asrRatePerHour),
            requestId: result.requestIds?.[0] || null,
            latencyMs: Date.now() - started,
        });
    });
    // EN: Synthesis saves the OGG even when Telegram delivery is not requested.
    // RU: Синтез сохраняет OGG, даже если доставка в Telegram не запрошена.
    server.registerTool('synthesize_speech', {
        title: 'Synthesize speech with Edge TTS or DeepSeek',
        description: 'Generate an OGG/Opus voice file. Edge TTS is primary (Russian and English), DeepSeek TTS is the fallback. Optionally send the voice note to Telegram.',
        inputSchema: z.object({
            text: z.string().describe('Text to speak'),
            voiceId: z.enum(['stella', 'tide']).optional().describe('stella = Клеопатра, tide = Македонский'),
            quality: z.string().optional().describe('64, 96, 128, 160, 192, 256 or dynamic'),
            language: z.enum(['auto', 'ru', 'en']).optional().describe('Edge voice language'),
            sendToTelegram: z.boolean().optional().describe('Send the generated voice note to the default Telegram home'),
        }),
    }, async ({ text, voiceId, quality, language, sendToTelegram }) => {
        const settings = deps.settingsStore.get();
        const resolved = await deps.ctx.credentials?.resolve?.(deps.config.apiKeyEnv);
        const key = typeof resolved === 'string' ? resolved.trim() : String(resolved?.value || '').trim();
        if (!deps.runtimeDeps?.ok)
            throw new Error('ffmpeg/ffprobe/libopus are not available');
        const started = Date.now();
        const result = await synthesizeVoice({
            key,
            config: deps.config,
            deps: deps.runtimeDeps,
            text,
            voiceId: normalizeVoice(voiceId || settings.voiceId),
            quality: quality || settings.ttsQuality,
            edgeEnabled: settings.edgeEnabled !== false,
            edgeLanguage: language || settings.edgeLanguage || 'auto',
        });
        const outDir = join(dataDir(), 'out');
        await mkdir(outDir, { recursive: true, mode: 0o700 });
        const outPath = join(outDir, `${randomUUID()}.ogg`);
        await writeFile(outPath, result.bytes, { mode: 0o600 });
        let sent = false;
        if (sendToTelegram) {
            const messenger = deps.ctx.get?.('messenger');
            if (!messenger?.send)
                throw new Error('Telegram messenger service is unavailable');
            await messenger.send({ platform: 'telegram', home: settings.telegramHome || 'default' }, { files: [{ bytes: result.bytes, mime: 'audio/ogg', kind: 'voice', name: 'deepseek-reply.ogg' }] });
            sent = true;
        }
        await deps.history.add(makeTtsRecord({
            started,
            result,
            config: deps.config,
            source: sent ? 'mcp-telegram' : 'mcp',
        }));
        return textResult({
            path: outPath,
            mime: result.mime,
            durationMs: result.durationMs,
            provider: result.provider,
            language: result.language,
            edgeVoice: result.edgeVoice,
            fallbackFrom: result.fallbackFrom,
            fallbackReason: result.fallbackReason,
            quality: result.quality,
            bitrateKbps: result.bitrateKbps,
            costUsd: result.provider === 'edge' ? 0 : ttsCostUsd(result.billedChars, deps.config.ttsRatePer10k),
            sentToTelegram: sent,
            latencyMs: Date.now() - started,
        });
    });
    // EN: Status tools intentionally return booleans/paths, never secret values.
    // RU: Status-tools намеренно возвращают bool/пути, но не значения секретов.
    server.registerTool('speech_status', {
        title: 'DeepSeek speech status',
        description: 'Report key configuration, ffmpeg/ffprobe, Edge TTS, MCP and ASR route status without exposing secrets.',
        inputSchema: z.object({}),
    }, async () => {
        const [key, edge] = await Promise.all([
            describeApiKey(deps.ctx, deps.config.apiKeyEnv),
            edgeStatus(),
        ]);
        return textResult({
            key,
            deps: deps.runtimeDeps,
            edge,
            mcp: await mcpStatus(),
            route: deps.getRouteStatus?.() || null,
            settings: deps.settingsStore.get(),
        });
    });
    // EN: Stats are read from the bounded history store.
    // RU: Статистика читается из ограниченной истории.
    server.registerTool('speech_stats', {
        title: 'DeepSeek speech statistics',
        description: 'Read aggregate speech statistics and recent ASR/TTS history.',
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).optional(),
        }),
    }, async ({ limit }) => {
        return textResult({
            totals: deps.history.totals(),
            entries: deps.history.list(limit || 20),
        });
    });
    server.registerTool('list_voices', {
        title: 'List speech voices',
        description: 'List logical voices, Edge Russian/English voices and DeepSeek fallback voice ids.',
        inputSchema: z.object({}),
    }, async () => {
        return textResult({
            voices: [
                { id: 'stella', name: 'Клеопатра', edge: EDGE_VOICES.stella, deepseek: 'stella' },
                { id: 'tide', name: 'Македонский', edge: EDGE_VOICES.tide, deepseek: 'tide' },
            ],
        });
    });
}
// EN: Loopback guard is the MCP service boundary; there is no bearer token.
// RU: Loopback-проверка — граница MCP-сервиса; bearer-токена здесь нет.
export async function handleMcpRequest({ ctx, config, settingsStore, history, getDeps, logger, getRouteStatus }, req, res) {
    if (!isLoopback(req.socket?.remoteAddress)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'loopback only' }));
        return;
    }
    let sdk;
    try {
        sdk = await loadSdk();
    }
    catch (err) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: redactError(err) }));
        return;
    }
    try {
        const runtimeDeps = await getDeps();
        const server = new sdk.McpServer({ name: 'deepseek_speech', version: '1.0.0' });
        const transport = new sdk.NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        registerTools(server, {
            ctx,
            config,
            settingsStore,
            history,
            runtimeDeps,
            getRouteStatus,
            z: sdk.z,
        });
        res.on('close', () => { server.close().catch(() => { }); });
        await server.connect(transport);
        await transport.handleRequest(req, res);
    }
    catch (err) {
        logger?.warn?.(`deepseek-speech: MCP request failed: ${redactError(err)}`);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: redactError(err) }));
        }
        else {
            try {
                res.end();
            }
            catch { /* best effort */ }
        }
    }
}
