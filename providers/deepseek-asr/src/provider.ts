import { normalizeConfig, type Config } from './config.js'
import { resolveApiKey, transcribeAudio, redactError } from './deepseek.js'
import { validateWave } from './wave.js'

/**
 * EN: Public provider metadata and the complete transcription call. The
 * language hint is accepted for the built-in UI; DeepSeek determines the
 * spoken language itself because its ASR endpoint has no language field.
 * RU: Публичные метаданные и полный вызов распознавания. Языковой hint нужен
 * штатному UI; DeepSeek сам определяет язык, так как у ASR endpoint нет поля языка.
 */
export const LANGUAGES = ['auto', 'ru', 'en'] as const

export function createProvider(ctx: any, rawConfig: any = {}) {
  const config: Config = normalizeConfig(rawConfig)
  return {
    info: {
      id: config.providerId,
      name: 'DeepSeek ASR',
      location: 'cloud' as const,
      languages: [...LANGUAGES],
    },
    async transcribe(input: { audio: Uint8Array; language: string }, signal?: AbortSignal) {
      if (!LANGUAGES.includes(input.language as any)) {
        throw new Error(`Unsupported language: ${input.language}`)
      }
      if (!input.audio?.byteLength) throw new Error('No audio data')
      if (input.audio.byteLength > config.maxAudioBytes) {
        throw new Error(`Audio exceeds ${config.maxAudioBytes} bytes`)
      }
      const audioSeconds = validateWave(input.audio, config.maxAudioSeconds)
      const key = await resolveApiKey(ctx, config.apiKeyEnv)
      const started = Date.now()
      try {
        const result = await transcribeAudio({
          key,
          baseUrl: config.baseUrl,
          audio: input.audio,
          signal,
          timeoutMs: config.timeoutMs,
        })
        return {
          text: result.text,
          audioSeconds,
          inferenceSeconds: (Date.now() - started) / 1000,
        }
      } catch (err) {
        throw new Error(redactError(err))
      }
    },
  }
}
