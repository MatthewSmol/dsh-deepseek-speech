import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { probeAudio, toWav16k, splitWav, toOggOpus, qualityArgs } from './deps.js'
import { transcribeWav, synthesizeWav, billedChars, redactError } from './deepseek.js'
import { synthesizeEdgeMp3, detectSpeechLanguage } from './edge.js'

export class SpeechError extends Error {
  constructor(message, { code = 'speech-error', status = 500 } = {}) {
    super(message)
    this.name = 'SpeechError'
    this.code = code
    this.status = status
  }
}

function extensionFor(mime) {
  const m = String(mime || '').toLowerCase()
  if (m.includes('ogg') || m.includes('opus')) return '.ogg'
  if (m.includes('mpeg') || m.includes('mp3')) return '.mp3'
  if (m.includes('mp4') || m.includes('m4a')) return '.m4a'
  if (m.includes('wav')) return '.wav'
  return '.audio'
}

export function prepareSpeechText(text, maxChars = 4000) {
  let out = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const limit = Math.max(100, Math.min(9000, Number(maxChars) || 4000))
  if (Array.from(out).length > limit) {
    out = Array.from(out).slice(0, limit).join('')
    const cut = Math.max(out.lastIndexOf('. '), out.lastIndexOf('! '), out.lastIndexOf('? '), out.lastIndexOf(' '))
    if (cut > 20) out = out.slice(0, cut)
  }
  return out.trim()
}

export async function transcribeBuffer({ key, config, deps, bytes, mimeType, signal }) {
  if (!deps?.ffmpeg?.path || !deps?.ffprobe?.path) {
    throw new SpeechError('ffmpeg and ffprobe are required for audio conversion', { code: 'deps-missing', status: 503 })
  }
  if (!bytes?.length) throw new SpeechError('No audio data', { code: 'no-audio', status: 400 })
  if (bytes.length > 8 * 1024 * 1024) {
    throw new SpeechError('Audio exceeds the DeepSeek ASR 8 MiB limit', { code: 'too-large', status: 413 })
  }
  const dir = await mkdtemp(join(tmpdir(), 'dsh-deepseek-speech-'))
  try {
    const input = join(dir, `input${extensionFor(mimeType)}`)
    const wav = join(dir, 'full.wav')
    await writeFile(input, bytes, { mode: 0o600 })
    const probe = await probeAudio(input, deps.ffprobe.path)
    if (!probe.durationMs) throw new SpeechError('Could not determine audio duration', { code: 'bad-audio', status: 400 })
    const maxMs = Math.max(10, Number(config.asrMaxDurationSeconds) || 600) * 1000
    if (probe.durationMs > maxMs) {
      throw new SpeechError(`Audio is longer than ${Math.round(maxMs / 1000)} seconds`, { code: 'too-long', status: 413 })
    }
    await toWav16k(deps.ffmpeg.path, input, wav, signal)
    let chunks = [{ path: wav }]
    const chunkMs = Math.max(30, Math.min(115, Number(config.asrChunkSeconds) || 110)) * 1000
    if (probe.durationMs > chunkMs) {
      chunks = await splitWav(deps.ffmpeg.path, wav, dir, chunkMs / 1000)
    }
    const texts = []
    const requestIds = []
    let apiMs = 0
    for (const chunk of chunks) {
      checkAbort(signal)
      const started = Date.now()
      const buf = await readFile(chunk.path)
      const result = await transcribeWav({ key, baseUrl: config.baseUrl, bytes: buf, signal })
      apiMs += Date.now() - started
      if (result.text) texts.push(result.text)
      if (result.requestId) requestIds.push(result.requestId)
    }
    const text = texts.join(' ').replace(/\s+/g, ' ').trim()
    if (!text) throw new SpeechError('DeepSeek ASR returned no text', { code: 'empty-transcript', status: 502 })
    return {
      text,
      durationMs: probe.durationMs,
      chunks: chunks.length,
      requestIds,
      apiMs,
      probe,
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function synthesizeEdgeOgg({ config, deps, text, voiceId, quality, edgeLanguage, signal }) {
  const prepared = prepareSpeechText(text, config.ttsMaxChars)
  if (!prepared) throw new SpeechError('Nothing to synthesize', { code: 'empty-text', status: 400 })
  const edge = await synthesizeEdgeMp3({
    text: prepared,
    voiceId,
    language: edgeLanguage,
    timeoutMs: config.edgeTimeoutMs || 60000,
  })
  const dir = await mkdtemp(join(tmpdir(), 'dsh-deepseek-speech-edge-'))
  try {
    const mp3 = join(dir, 'edge.mp3')
    const ogg = join(dir, 'reply.ogg')
    await writeFile(mp3, edge.bytes, { mode: 0o600 })
    const result = await toOggOpus(deps.ffmpeg.path, mp3, ogg, quality, signal)
    const buf = await readFile(ogg)
    const info = await stat(ogg)
    const probed = await probeAudio(ogg, deps.ffprobe.path)
    const bitrateKbps = probed.durationMs > 0
      ? Math.round((info.size * 8) / (probed.durationMs / 1000) / 1000)
      : (qualityArgs(quality).bitrateKbps || 0)
    return {
      bytes: buf,
      mime: 'audio/ogg',
      durationMs: probed.durationMs,
      quality: result.quality.label,
      bitrateKbps,
      preparedText: prepared,
      billedChars: 0,
      language: edge.language,
      edgeVoice: edge.edgeVoice,
      sourceBitrateKbps: edge.sourceBitrateKbps,
      provider: 'edge',
      fallbackFrom: null,
      fallbackReason: null,
      latencyMs: 0,
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export async function synthesizeDeepSeekOgg({ key, config, deps, text, voiceId, quality, signal }) {
  if (!deps?.ffmpeg?.path || !deps?.ffprobe?.path) {
    throw new SpeechError('ffmpeg and ffprobe are required for OGG/Opus synthesis', { code: 'deps-missing', status: 503 })
  }
  let prepared = prepareSpeechText(text, config.ttsMaxChars)
  if (!prepared) throw new SpeechError('Nothing to synthesize', { code: 'empty-text', status: 400 })
  if (billedChars(prepared) > 10000) {
    const chars = Array.from(prepared)
    let lo = 0
    let hi = chars.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      if (billedChars(chars.slice(0, mid).join('')) <= 10000) lo = mid
      else hi = mid - 1
    }
    prepared = chars.slice(0, lo).join('').trim()
    if (!prepared) throw new SpeechError('Text exceeds the DeepSeek TTS 10,000 billed-character limit', { code: 'too-long', status: 413 })
  }
  const billed = billedChars(prepared)
  const dir = await mkdtemp(join(tmpdir(), 'dsh-deepseek-speech-tts-'))
  try {
    const wav = join(dir, 'tts.wav')
    const ogg = join(dir, 'reply.ogg')
    const started = Date.now()
    const wavData = await synthesizeWav({
      key,
      baseUrl: config.baseUrl,
      text: prepared,
      voiceId,
      signal,
    })
    await writeFile(wav, wavData.bytes, { mode: 0o600 })
    const result = await toOggOpus(deps.ffmpeg.path, wav, ogg, quality, signal)
    const buf = await readFile(ogg)
    const info = await stat(ogg)
    const probed = await probeAudio(ogg, deps.ffprobe.path)
    const bitrateKbps = probed.durationMs > 0
      ? Math.round((info.size * 8) / (probed.durationMs / 1000) / 1000)
      : (qualityArgs(quality).bitrateKbps || 0)
    return {
      bytes: buf,
      mime: 'audio/ogg',
      durationMs: probed.durationMs,
      quality: result.quality.label,
      bitrateKbps,
      preparedText: prepared,
      billedChars: billed,
      language: detectSpeechLanguage(prepared, 'auto'),
      edgeVoice: null,
      sourceBitrateKbps: null,
      provider: 'deepseek',
      fallbackFrom: null,
      fallbackReason: null,
      latencyMs: Date.now() - started,
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export async function synthesizeVoice({
  key,
  config,
  deps,
  text,
  voiceId,
  quality,
  edgeEnabled = true,
  edgeLanguage = 'auto',
  signal,
}) {
  if (!deps?.ffmpeg?.path || !deps?.ffprobe?.path) {
    throw new SpeechError('ffmpeg and ffprobe are required for OGG/Opus synthesis', { code: 'deps-missing', status: 503 })
  }
  let edgeError = null
  if (edgeEnabled) {
    const started = Date.now()
    try {
      const edge = await synthesizeEdgeOgg({ config, deps, text, voiceId, quality, edgeLanguage, signal })
      edge.latencyMs = Date.now() - started
      return edge
    } catch (err) {
      edgeError = redactError(err)
    }
  }
  if (!key) {
    const suffix = edgeError ? `: ${edgeError}` : ''
    throw new SpeechError(`DeepSeek API key is not configured${suffix}`, { code: 'no-key', status: 503 })
  }
  const started = Date.now()
  const deep = await synthesizeDeepSeekOgg({ key, config, deps, text, voiceId, quality, signal })
  deep.latencyMs = Date.now() - started
  deep.fallbackFrom = edgeEnabled ? 'edge' : null
  deep.fallbackReason = edgeError
  deep.language = detectSpeechLanguage(deep.preparedText, edgeLanguage)
  return deep
}

function checkAbort(signal) {
  if (signal?.aborted) throw new SpeechError('Aborted', { code: 'aborted', status: 499 })
}
