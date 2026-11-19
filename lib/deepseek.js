const DEFAULT_BASE = 'https://api.deepseek.com'

export class DeepSeekApiError extends Error {
  constructor(message, { status = 0, code = 'deepseek-error' } = {}) {
    super(message)
    this.name = 'DeepSeekApiError'
    this.status = status
    this.code = code
  }
}

export function apiRoot(baseUrl) {
  return String(baseUrl || DEFAULT_BASE).replace(/\/+$/, '')
}

export async function resolveApiKey(ctx, apiKeyEnv) {
  if (!ctx?.credentials || !apiKeyEnv) return ''
  try {
    const resolved = await ctx.credentials.resolve(apiKeyEnv)
    if (typeof resolved === 'string') return resolved.trim()
    return String(resolved?.value || '').trim()
  } catch {
    return ''
  }
}

export async function describeApiKey(ctx, apiKeyEnv) {
  if (!ctx?.credentials || !apiKeyEnv) return { configured: false, writable: false }
  try {
    const info = await ctx.credentials.describe(apiKeyEnv)
    return {
      configured: Boolean(info?.configured),
      source: info?.source || null,
      writable: info?.writable !== false,
    }
  } catch {
    return { configured: false, writable: false }
  }
}

function timeoutSignal(ms, parent) {
  const timeout = AbortSignal.timeout(Math.max(1000, Number(ms) || 120000))
  if (!parent) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([parent, timeout])
  return parent
}

function errorText(data, fallback) {
  const err = data?.error
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  if (err?.code) return err.code
  return fallback
}

export async function transcribeWav({ key, baseUrl, bytes, signal, timeoutMs = 120000 }) {
  if (!key) throw new DeepSeekApiError('DeepSeek API key is not configured', { code: 'no-key' })
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'audio/wav' }), 'speech.wav')
  let res
  try {
    res = await fetch(`${apiRoot(baseUrl)}/v1/tools/asr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: timeoutSignal(timeoutMs, signal),
    })
  } catch (err) {
    throw new DeepSeekApiError(`DeepSeek ASR request failed: ${err.message}`, { code: 'network' })
  }
  let data = null
  try { data = await res.json() } catch { data = null }
  if (!res.ok) {
    throw new DeepSeekApiError(errorText(data, `DeepSeek ASR HTTP ${res.status}`), {
      status: res.status,
      code: `http-${res.status}`,
    })
  }
  const text = String(data?.text || '').trim()
  if (!text) throw new DeepSeekApiError('DeepSeek ASR returned an empty transcript', { code: 'empty-transcript' })
  return {
    text,
    durationMs: Math.max(0, Number(data?.duration_ms) || 0),
    requestId: data?.request_id ? String(data.request_id) : null,
  }
}

export async function synthesizeWav({ key, baseUrl, text, voiceId = 'stella', signal, timeoutMs = 180000 }) {
  if (!key) throw new DeepSeekApiError('DeepSeek API key is not configured', { code: 'no-key' })
  const body = {
    text: String(text || ''),
    voice_id: voiceId === 'tide' ? 'tide' : 'stella',
    format: 'wav',
    filter_markdown: true,
  }
  if (!body.text.trim()) throw new DeepSeekApiError('Nothing to synthesize', { code: 'empty-text' })
  let res
  try {
    res = await fetch(`${apiRoot(baseUrl)}/v1/tools/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: timeoutSignal(timeoutMs, signal),
    })
  } catch (err) {
    throw new DeepSeekApiError(`DeepSeek TTS request failed: ${err.message}`, { code: 'network' })
  }
  if (!res.ok) {
    let data = null
    try { data = await res.json() } catch { data = null }
    throw new DeepSeekApiError(errorText(data, `DeepSeek TTS HTTP ${res.status}`), {
      status: res.status,
      code: `http-${res.status}`,
    })
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.length) throw new DeepSeekApiError('DeepSeek TTS returned empty audio', { code: 'empty-audio' })
  return {
    bytes: buf,
    mime: res.headers.get('content-type') || 'audio/wav',
  }
}

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u

export function billedChars(text) {
  let total = 0
  for (const ch of String(text || '')) total += CJK.test(ch) ? 2 : 1
  return total
}

export function estimateTokens(text) {
  const chars = Array.from(String(text || '')).length
  return Math.max(0, Math.ceil(chars / 4))
}

export function asrCostUsd(durationMs, ratePerHour = 0.058) {
  const seconds = Math.ceil(Math.max(0, Number(durationMs) || 0) / 1000)
  return (seconds / 3600) * Number(ratePerHour || 0)
}

export function ttsCostUsd(chars, ratePer10k = 0.225) {
  return (Math.max(0, Number(chars) || 0) / 10000) * Number(ratePer10k || 0)
}

export function redactError(err) {
  const message = err instanceof Error ? err.message : String(err || 'unknown error')
  const keyPattern = new RegExp('s' + 'k-' + '[A-Za-z0-9]{8,}', 'g')
  const tokenPattern = new RegExp('github_' + 'pat_' + '[A-Za-z0-9_]+', 'g')
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+\/=-]+/gi, 'Bearer [redacted]')
    .replace(keyPattern, '[redacted-key]')
    .replace(tokenPattern, '[redacted-token]')
    .slice(0, 1000)
}
