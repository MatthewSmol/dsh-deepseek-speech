/**
 * EN: ffmpeg/ffprobe discovery, command execution, audio probing, WAV
 * splitting and OGG/Opus encoding. All subprocesses are bounded and never
 * receive credentials.
 * RU: Поиск ffmpeg/ffprobe, запуск команд, анализ аудио, нарезка WAV и
 * кодирование OGG/Opus. Все подпроцессы ограничены по времени и не получают
 * секретов.
 */
import { spawn } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
const MAX_OUTPUT = 1024 * 1024;
export function qualityArgs(quality) {
    const value = String(quality ?? '64').toLowerCase();
    if (value === 'dynamic' || value === 'vbr' || value === 'auto') {
        return {
            label: 'Dynamic VBR',
            bitrateKbps: null,
            args: ['-c:a', 'libopus', '-b:a', '256k', '-vbr', 'on', '-application', 'audio', '-ar', '48000', '-ac', '1', '-f', 'ogg'],
        };
    }
    const n = [64, 96, 128, 160, 192, 256].includes(Number(value)) ? Number(value) : 64;
    return {
        label: `${n} kbps`,
        bitrateKbps: n,
        args: [
            '-c:a', 'libopus',
            '-b:a', `${n}k`,
            '-vbr', 'off',
            '-application', n <= 96 ? 'voip' : 'audio',
            '-ar', '48000',
            '-ac', '1',
            '-f', 'ogg',
        ],
    };
}
export function runCommand(command, args = [], { timeoutMs = 30000, env, signal } = {}) {
    return new Promise((resolve, reject) => {
        let child;
        try {
            child = spawn(command, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: env ? { ...process.env, ...env } : process.env,
            });
        }
        catch (err) {
            reject(err);
            return;
        }
        let stdout = '';
        let stderr = '';
        let settled = false;
        const finish = (err, code = 0) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            if (signal)
                signal.removeEventListener('abort', onAbort);
            if (err)
                reject(err);
            else
                resolve({ code, stdout, stderr });
        };
        // EN: Kill runaway ffmpeg/ffprobe processes after the timeout.
        // RU: Убиваем зависшие ffmpeg/ffprobe по таймауту.
        const timer = setTimeout(() => {
            try {
                child.kill('SIGKILL');
            }
            catch { /* best effort */ }
            finish(new Error(`${command} timed out after ${timeoutMs}ms`));
        }, Math.max(1000, Number(timeoutMs) || 30000));
        const onAbort = () => {
            try {
                child.kill('SIGKILL');
            }
            catch { /* best effort */ }
            finish(new Error('aborted'));
        };
        if (signal) {
            if (signal.aborted)
                onAbort();
            else
                signal.addEventListener('abort', onAbort, { once: true });
        }
        child.stdout?.on('data', (chunk) => {
            if (stdout.length < MAX_OUTPUT)
                stdout += String(chunk);
        });
        child.stderr?.on('data', (chunk) => {
            if (stderr.length < MAX_OUTPUT)
                stderr += String(chunk);
        });
        child.on('error', (err) => finish(err));
        child.on('close', (code) => finish(null, code ?? 0));
    });
}
/**
 * EN: Checks the executable bit before attempting a spawn.
 * RU: Проверяет бит исполнения перед запуском.
 */
function isExecutable(path) {
    try {
        accessSync(path, constants.X_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * EN: Tries candidates in order and returns the first successful version probe.
 * RU: Перебирает кандидатов и возвращает первый успешный probe версии.
 */
async function firstWorking(candidates, args) {
    for (const command of candidates) {
        if (!command)
            continue;
        if (command.includes('/') && !isExecutable(command))
            continue;
        try {
            const out = await runCommand(command, args, { timeoutMs: 10000 });
            if (out.code === 0) {
                return { path: command, version: out.stdout.split('\n')[0].trim() || out.stderr.split('\n')[0].trim() };
            }
        }
        catch {
            /* try next */
        }
    }
    return null;
}
/**
 * EN: Candidate paths are intentionally explicit so a DSH restart does not
 * depend on shell PATH.
 * RU: Пути-кандидаты заданы явно, чтобы запуск DSH не зависел от PATH shell.
 */
export async function resolveDeps(config = {}) {
    const ffmpegCandidates = [
        config.ffmpegPath,
        process.env.FFMPEG_PATH,
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/home/main/test/bin/ffmpeg',
        '/home/main/TelegramBot/work/ytdl/ffmpeg',
        'ffmpeg',
    ];
    const ffprobeCandidates = [
        config.ffprobePath,
        process.env.FFPROBE_PATH,
        '/usr/bin/ffprobe',
        '/usr/local/bin/ffprobe',
        '/home/main/test/bin/ffprobe',
        'ffprobe',
    ];
    const [ffmpeg, ffprobe] = await Promise.all([
        firstWorking(ffmpegCandidates, ['-version']),
        firstWorking(ffprobeCandidates, ['-version']),
    ]);
    let libopus = false;
    if (ffmpeg) {
        try {
            const enc = await runCommand(ffmpeg.path, ['-hide_banner', '-encoders'], { timeoutMs: 15000 });
            libopus = /libopus/.test(enc.stdout + enc.stderr);
        }
        catch {
            libopus = false;
        }
    }
    return {
        ok: Boolean(ffmpeg && ffprobe && libopus),
        ffmpeg: { found: Boolean(ffmpeg), path: ffmpeg?.path || null, version: ffmpeg?.version || null },
        ffprobe: { found: Boolean(ffprobe), path: ffprobe?.path || null, version: ffprobe?.version || null },
        libopus,
        checkedAt: Date.now(),
    };
}
export async function installFfmpeg(logger) {
    const before = await resolveDeps();
    if (before.ffmpeg.found && before.ffprobe.found && before.libopus) {
        return { ok: true, alreadyInstalled: true, deps: before };
    }
    // EN: Never prompt for a password from a web request; only `sudo -n`.
    // RU: Никогда не запрашиваем пароль из web-запроса; только `sudo -n`.
    let sudoProbe;
    try {
        sudoProbe = await runCommand('sudo', ['-n', 'true'], { timeoutMs: 10000 });
    }
    catch (err) {
        return {
            ok: false,
            code: 'root-required',
            command: 'sudo apt-get update && sudo apt-get install -y ffmpeg',
            message: `Passwordless sudo is unavailable: ${err.message}`,
        };
    }
    if (sudoProbe.code !== 0) {
        return {
            ok: false,
            code: 'root-required',
            command: 'sudo apt-get update && sudo apt-get install -y ffmpeg',
            message: (sudoProbe.stderr || sudoProbe.stdout || 'sudo -n failed').trim().slice(0, 800),
        };
    }
    const env = { DEBIAN_FRONTEND: 'noninteractive' };
    let update;
    try {
        update = await runCommand('sudo', ['-n', 'env', 'DEBIAN_FRONTEND=noninteractive', 'apt-get', 'update'], { timeoutMs: 300000, env });
    }
    catch (err) {
        return { ok: false, code: 'install-failed', message: `apt-get update failed: ${err.message}` };
    }
    if (update.code !== 0) {
        return { ok: false, code: 'install-failed', message: (update.stderr || update.stdout).trim().slice(-1200) };
    }
    let install;
    try {
        install = await runCommand('sudo', ['-n', 'env', 'DEBIAN_FRONTEND=noninteractive', 'apt-get', 'install', '-y', 'ffmpeg'], { timeoutMs: 600000, env });
    }
    catch (err) {
        return { ok: false, code: 'install-failed', message: `apt-get install failed: ${err.message}` };
    }
    if (install.code !== 0) {
        return { ok: false, code: 'install-failed', message: (install.stderr || install.stdout).trim().slice(-1200) };
    }
    const after = await resolveDeps();
    if (!after.ok) {
        return { ok: false, code: 'install-incomplete', message: 'ffmpeg installed but ffprobe/libopus is still unavailable', deps: after };
    }
    logger?.info?.('deepseek-speech: ffmpeg installed globally');
    return { ok: true, installed: true, deps: after };
}
export async function probeAudio(path, ffprobePath) {
    if (!ffprobePath)
        throw new Error('ffprobe is not available');
    const out = await runCommand(ffprobePath, [
        '-v', 'error',
        '-show_entries', 'format=duration,format_name,bit_rate',
        '-show_entries', 'stream=codec_name,codec_type,sample_rate,channels',
        '-of', 'json',
        path,
    ], { timeoutMs: 30000 });
    if (out.code !== 0)
        throw new Error(`ffprobe failed: ${out.stderr.trim().slice(-400)}`);
    let data;
    try {
        data = JSON.parse(out.stdout);
    }
    catch {
        throw new Error('ffprobe returned invalid JSON');
    }
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const audio = streams.find((s) => s.codec_type === 'audio');
    if (!audio)
        throw new Error('no audio stream found');
    const durationMs = Math.max(0, Math.round((Number(data.format?.duration) || 0) * 1000));
    return {
        durationMs,
        formatName: data.format?.format_name || '',
        bitRate: Number(data.format?.bit_rate) || (audio.bit_rate ? Number(audio.bit_rate) : null),
        codec: audio.codec_name || '',
        sampleRate: Number(audio.sample_rate) || null,
        channels: Number(audio.channels) || null,
    };
}
export async function toWav16k(ffmpegPath, input, output, signal) {
    if (!ffmpegPath)
        throw new Error('ffmpeg is not available');
    const out = await runCommand(ffmpegPath, [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', input,
        '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le',
        output,
    ], { timeoutMs: 120000, signal });
    if (out.code !== 0)
        throw new Error(`ffmpeg conversion failed: ${out.stderr.trim().slice(-500)}`);
    return output;
}
export async function splitWav(ffmpegPath, input, dir, chunkSeconds) {
    const out = await runCommand(ffmpegPath, [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', input,
        '-f', 'segment',
        '-segment_time', String(Math.max(30, Math.min(115, Number(chunkSeconds) || 110))),
        '-reset_timestamps', '1',
        '-c', 'copy',
        join(dir, 'chunk-%03d.wav'),
    ], { timeoutMs: 120000 });
    if (out.code !== 0)
        throw new Error(`ffmpeg split failed: ${out.stderr.trim().slice(-500)}`);
    const names = (await readdir(dir)).filter((name) => /^chunk-\d+\.wav$/.test(name)).sort();
    if (!names.length)
        throw new Error('ffmpeg produced no audio chunks');
    const chunks = [];
    for (const name of names) {
        const path = join(dir, name);
        const info = await stat(path);
        chunks.push({ path, bytes: info.size });
    }
    return chunks;
}
export async function toOggOpus(ffmpegPath, input, output, quality, signal) {
    if (!ffmpegPath)
        throw new Error('ffmpeg is not available');
    const q = qualityArgs(quality);
    const out = await runCommand(ffmpegPath, [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', input,
        ...q.args,
        output,
    ], { timeoutMs: 120000, signal });
    if (out.code !== 0)
        throw new Error(`ffmpeg OGG/Opus conversion failed: ${out.stderr.trim().slice(-500)}`);
    return { path: output, quality: q };
}
