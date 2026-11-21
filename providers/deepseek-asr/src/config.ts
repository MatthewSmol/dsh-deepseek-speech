/**
 * EN: Provider configuration. The key itself is never stored here; only the
 * credentials variable name is configurable.
 * RU: Конфигурация провайдера. Сам ключ здесь не хранится; настраивается
 * только имя переменной в credentials.
 */
export interface Config {
  apiKeyEnv: string
  baseUrl: string
  providerId: string
  timeoutMs: number
  maxAudioSeconds: number
  maxAudioBytes: number
}

export const DEFAULTS: Config = {
  apiKeyEnv: 'DEEPSEEK_API_KEY',
  baseUrl: 'https://api.deepseek.com',
  providerId: 'deepseek-asr',
  timeoutMs: 120000,
  maxAudioSeconds: 600,
  maxAudioBytes: 8 * 1024 * 1024,
}

function integer(value: any, fallback: number, min: number, max: number): number {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * EN: Merge runtime configuration with safe defaults.
 * RU: Объединяет runtime-конфигурацию с безопасными значениями по умолчанию.
 */
export function normalizeConfig(raw: any = {}): Config {
  const baseUrl = String(raw.baseUrl || DEFAULTS.baseUrl).trim().replace(/\/+$/, '')
  return {
    apiKeyEnv: String(raw.apiKeyEnv || DEFAULTS.apiKeyEnv).trim() || DEFAULTS.apiKeyEnv,
    baseUrl: baseUrl || DEFAULTS.baseUrl,
    providerId: String(raw.providerId || DEFAULTS.providerId).trim() || DEFAULTS.providerId,
    timeoutMs: integer(raw.timeoutMs, DEFAULTS.timeoutMs, 1000, 300000),
    maxAudioSeconds: integer(raw.maxAudioSeconds, DEFAULTS.maxAudioSeconds, 10, 600),
    maxAudioBytes: integer(raw.maxAudioBytes, DEFAULTS.maxAudioBytes, 64 * 1024, 8 * 1024 * 1024),
  }
}
