/**
 * EN: Minimal DeepSeek ASR HTTP client for the Voice input provider. The key
 * lives only in the Authorization header and error text is redacted.
 * RU: Минимальный HTTP-клиент DeepSeek ASR для провайдера Voice input. Ключ
 * передаётся только в Authorization, текст ошибок очищается.
 */
const DEFAULT_BASE = 'https://api.deepseek.com'

export class DeepSeekAsrError extends Error {
  status: number
  code: string

  constructor(message: string, { status = 0, code = 'deepseek-asr-error' }: { status?: number; code?: string } = {}) {
    super(message)
    this.name = 'DeepSeekAsrError'
    this.status = status
    this.code = code
  }
}

export function apiRoot(baseUrl: string): string {
  return String(baseUrl || DEFAULT_BASE).replace(/\/+$/, '')
}

/**
 * EN: Resolve the already configured DSH credential; never copy it into config.
 * RU: Получает уже настроенный credential DSH; ключ не копируется в конфиг.
 */
export async function resolveApiKey(ctx: any, apiKeyEnv: string): Promise<string> {
  if (!ctx?.credentials || !apiKeyEnv) return ''
  try {
    const resolved = await ctx.credentials.resolve(apiKeyEnv)
    if (typeof resolved === 'string') return resolved.trim()
    return String(resolved?.value || '').trim()
  } catch {
    return ''
  }
}

function errorText(data: any, fallback: string): string {
  const err = data?.error
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  if (err?.code) return err.code
  return fallback
}

/**
 * EN: Remove credentials from messages before they reach the browser UI.
 * RU: Удаляет учётные данные из сообщений до показа в браузерном UI.
 */
export function redactError(err: any): string {
  const message = err instanceof Error ? err.message : String(err || 'unknown error')
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+\/=-]+/gi, 'Bearer [redacted]')
    .replace(/sk-[A-Za-z0-9]{8,}/g, '[redacted-key]')
    .slice(0, 1000)
}

function timeoutSignal(ms: number, parent?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(Math.max(1000, Math.min(300000, Number(ms) || 120000)))
  if (!parent) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([parent, timeout])
  return parent
}

export interface DeepSeekTranscript {
  text: string
  requestId: string | null
  inferenceSeconds: number
}

/**
 * EN: Send one complete WAV recording to DeepSeek ASR.
 * RU: Отправляет одну готовую WAV-запись в DeepSeek ASR.
 */
export async function transcribeAudio({ key, baseUrl, audio, signal, timeoutMs }: {
  key: string
  baseUrl: string
  audio: Uint8Array
  signal?: AbortSignal
  timeoutMs: number
}): Promise<DeepSeekTranscript> {
  if (!key) throw new DeepSeekAsrError('DeepSeek API key is not configured', { code: 'no-key' })
  if (!audio?.byteLength) throw new DeepSeekAsrError('No audio data', { code: 'no-audio' })
  if (audio.byteLength > 8 * 1024 * 1024) {
    throw new DeepSeekAsrError('Audio exceeds the DeepSeek ASR 8 MiB limit', { code: 'too-large', status: 413 })
  }
  const form = new FormData()
  form.append('file', new Blob([audio as unknown as BlobPart], { type: 'audio/wav' }), 'speech.wav')
  const started = Date.now()
  let res: Response
  try {
    res = await fetch(`${apiRoot(baseUrl)}/v1/tools/asr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: timeoutSignal(timeoutMs, signal),
    })
  } catch (err: any) {
    throw new DeepSeekAsrError(`DeepSeek ASR request failed: ${redactError(err)}`, { code: 'network' })
  }
  let data: any = null
  try { data = await res.json() } catch { data = null }
  if (!res.ok) {
    throw new DeepSeekAsrError(errorText(data, `DeepSeek ASR HTTP ${res.status}`), {
      status: res.status,
      code: `http-${res.status}`,
    })
  }
  const text = String(data?.text || '').trim()
  if (!text) throw new DeepSeekAsrError('DeepSeek ASR returned an empty transcript', { code: 'empty-transcript' })
  return {
    text,
    requestId: data?.request_id ? String(data.request_id) : null,
    inferenceSeconds: (Date.now() - started) / 1000,
  }
}
