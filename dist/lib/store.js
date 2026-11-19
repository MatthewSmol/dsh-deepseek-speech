/**
 * EN: Persistence layer. Settings and history are stored under
 * `$DSH_HOME/deepseek-speech` with atomic writes and mode 0600. No key or
 * audio bytes are written here.
 * RU: Слой хранения. Настройки и история лежат в
 * `$DSH_HOME/deepseek-speech`, записываются атомарно с правами 0600.
 * Ключи и аудио здесь не сохраняются.
 */
import { mkdirSync, readFileSync, chmodSync, existsSync } from 'node:fs';
import { mkdir, writeFile, rename, chmod, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
export function dshHome() {
    return process.env.DSH_HOME || join(homedir(), '.dsh');
}
/**
 * EN: All plugin data stays under DSH_HOME, never under the repository.
 * RU: Все данные плагина находятся в DSH_HOME, а не в репозитории.
 */
export function dataDir() {
    return join(dshHome(), 'deepseek-speech');
}
function readJson(file, fallback) {
    try {
        if (!existsSync(file))
            return fallback;
        return JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        return fallback;
    }
}
/**
 * EN: Directories are created with 0700; settings/history files use 0600.
 * RU: Каталоги создаются с 0700; файлы настроек/истории — с 0600.
 */
function ensureDirSync(dir) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    try {
        chmodSync(dir, 0o700);
    }
    catch { /* best effort */ }
}
async function writeJsonAtomic(file, value) {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    const tmp = `${file}.${randomUUID().slice(0, 8)}.tmp`;
    try {
        await writeFile(tmp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
        await chmod(tmp, 0o600);
        await rename(tmp, file);
    }
    catch (err) {
        try {
            await unlink(tmp);
        }
        catch { /* best effort */ }
        throw err;
    }
}
export class SettingsStore {
    defaults;
    logger;
    file;
    state;
    writeChain;
    constructor(defaults, logger) {
        this.defaults = { ...defaults };
        this.logger = logger;
        this.file = join(dataDir(), 'settings.json');
        this.state = { ...defaults };
        this.writeChain = Promise.resolve();
        ensureDirSync(dataDir());
        const raw = readJson(this.file, null);
        if (raw && typeof raw === 'object') {
            this.state = sanitizeSettings({ ...defaults, ...raw }, defaults);
        }
    }
    get() {
        return { ...this.state };
    }
    async update(patch) {
        const clean = Object.fromEntries(Object.entries(patch || {}).filter(([, value]) => value !== undefined));
        const next = sanitizeSettings({ ...this.state, ...clean }, this.defaults);
        this.state = next;
        this.writeChain = this.writeChain.then(() => writeJsonAtomic(this.file, next)).catch((err) => {
            this.logger?.warn?.(`deepseek-speech: settings persist failed: ${err.message}`);
        });
        await this.writeChain;
        return this.get();
    }
}
function asBool(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function asInt(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}
/**
 * EN: Normalizes every setting before it reaches the runtime, including Edge
 * enable/language and quality.
 * RU: Нормализует каждую настройку до runtime, включая Edge и качество.
 */
function sanitizeSettings(raw, defaults) {
    const voiceId = raw.voiceId === 'tide' ? 'tide' : 'stella';
    const quality = normalizeQuality(raw.ttsQuality);
    return {
        alwaysVoice: asBool(raw.alwaysVoice, defaults.alwaysVoice),
        voiceId,
        ttsQuality: quality,
        ttsMaxChars: asInt(raw.ttsMaxChars, defaults.ttsMaxChars, 100, 9000),
        telegramHome: String(raw.telegramHome || defaults.telegramHome || 'default').trim().slice(0, 80) || 'default',
        edgeEnabled: asBool(raw.edgeEnabled, defaults.edgeEnabled !== false),
        edgeLanguage: ['auto', 'ru', 'en'].includes(raw.edgeLanguage) ? raw.edgeLanguage : (defaults.edgeLanguage || 'auto'),
    };
}
export function normalizeQuality(value) {
    const raw = String(value ?? '64').trim().toLowerCase();
    if (raw === 'dynamic' || raw === 'vbr' || raw === 'auto')
        return 'dynamic';
    const n = Number(raw);
    if (!Number.isFinite(n))
        return '64';
    const allowed = [64, 96, 128, 160, 192, 256];
    return String(allowed.reduce((best, cur) => Math.abs(cur - n) < Math.abs(best - n) ? cur : best, 64));
}
export function historyTotals(entries) {
    const totals = {
        count: 0,
        asrCount: 0,
        ttsCount: 0,
        errorCount: 0,
        audioDurationMs: 0,
        textChars: 0,
        tokensEstimate: 0,
        costUsd: 0,
        latencyMs: 0,
        avgLatencyMs: 0,
        successRate: 0,
        lastAt: 0,
    };
    for (const e of entries || []) {
        totals.count += 1;
        if (e.kind === 'asr')
            totals.asrCount += 1;
        if (e.kind === 'tts')
            totals.ttsCount += 1;
        if (e.status === 'error')
            totals.errorCount += 1;
        totals.audioDurationMs += Number(e.audioDurationMs) || 0;
        totals.textChars += Number(e.textChars) || 0;
        totals.tokensEstimate += Number(e.tokensEstimate) || 0;
        totals.costUsd += Number(e.costUsd) || 0;
        totals.latencyMs += Number(e.latencyMs) || 0;
        totals.lastAt = Math.max(totals.lastAt, Number(e.at) || 0);
    }
    totals.avgLatencyMs = totals.count ? Math.round(totals.latencyMs / totals.count) : 0;
    totals.successRate = totals.count ? Math.round(((totals.count - totals.errorCount) / totals.count) * 1000) / 10 : 0;
    return totals;
}
export class HistoryStore {
    limit;
    logger;
    file;
    entries;
    writeChain;
    constructor(limit, logger) {
        this.limit = Math.max(1, Math.min(5000, Number(limit) || 500));
        this.logger = logger;
        this.file = join(dataDir(), 'history.json');
        this.entries = [];
        this.writeChain = Promise.resolve();
        ensureDirSync(dataDir());
        const raw = readJson(this.file, null);
        const rows = Array.isArray(raw) ? raw : (Array.isArray(raw?.entries) ? raw.entries : []);
        this.entries = rows.filter(isEntry).slice(-this.limit);
    }
    /**
     * EN: Sanitizes one entry, trims the ring buffer, and persists asynchronously.
     * RU: Проверяет запись, обрезает кольцевой буфер и сохраняет асинхронно.
     */
    add(entry) {
        const row = sanitizeEntry(entry);
        this.entries.push(row);
        if (this.entries.length > this.limit)
            this.entries.splice(0, this.entries.length - this.limit);
        this.persist();
        return row;
    }
    persist() {
        const payload = { version: 1, entries: this.entries };
        this.writeChain = this.writeChain.then(() => writeJsonAtomic(this.file, payload)).catch((err) => {
            this.logger?.warn?.(`deepseek-speech: history persist failed: ${err.message}`);
        });
        return this.writeChain;
    }
    list(limit = 100) {
        const n = Math.max(1, Math.min(500, Number(limit) || 100));
        return this.entries.slice(-n).reverse();
    }
    totals() {
        return historyTotals(this.entries);
    }
    async clear() {
        this.entries = [];
        await this.persist();
    }
}
function isEntry(value) {
    return value && typeof value === 'object' && (value.kind === 'asr' || value.kind === 'tts');
}
function sanitizeEntry(entry) {
    const kind = entry.kind === 'tts' ? 'tts' : 'asr';
    const status = entry.status === 'error' ? 'error' : (entry.status === 'skipped' ? 'skipped' : 'ok');
    return {
        id: String(entry.id || randomUUID()),
        kind,
        source: String(entry.source || 'voice').slice(0, 40),
        at: Number(entry.at) || Date.now(),
        status,
        latencyMs: Math.max(0, Math.round(Number(entry.latencyMs) || 0)),
        audioDurationMs: Math.max(0, Math.round(Number(entry.audioDurationMs) || 0)),
        textChars: Math.max(0, Math.round(Number(entry.textChars) || 0)),
        billedChars: Math.max(0, Math.round(Number(entry.billedChars) || 0)),
        tokensEstimate: Math.max(0, Math.round(Number(entry.tokensEstimate) || 0)),
        costUsd: Math.max(0, Number(entry.costUsd) || 0),
        preview: String(entry.preview || '').slice(0, 500),
        error: entry.error ? String(entry.error).slice(0, 1000) : null,
        requestId: entry.requestId ? String(entry.requestId).slice(0, 120) : null,
        sessionId: entry.sessionId ? String(entry.sessionId).slice(0, 120) : null,
        voiceId: entry.voiceId ? String(entry.voiceId).slice(0, 20) : null,
        provider: entry.provider ? String(entry.provider).slice(0, 20) : null,
        language: entry.language ? String(entry.language).slice(0, 8) : null,
        edgeVoice: entry.edgeVoice ? String(entry.edgeVoice).slice(0, 80) : null,
        fallbackFrom: entry.fallbackFrom ? String(entry.fallbackFrom).slice(0, 20) : null,
        fallbackReason: entry.fallbackReason ? String(entry.fallbackReason).slice(0, 1000) : null,
        quality: entry.quality ? String(entry.quality).slice(0, 20) : null,
        bitrateKbps: entry.bitrateKbps == null ? null : Math.max(0, Math.round(Number(entry.bitrateKbps) || 0)),
        chunks: Math.max(1, Math.round(Number(entry.chunks) || 1)),
    };
}
export function previewText(text, max = 280) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
