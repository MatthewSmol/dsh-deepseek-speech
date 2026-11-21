import { createProvider } from './provider.js'
import { normalizeConfig } from './config.js'

export { createProvider } from './provider.js'

/**
 * EN: Host-only Cordis plugin. It registers DeepSeek ASR with the built-in
 * experimental Voice input through ctx.speechToText; no browser UI is shipped.
 * RU: Host-only Cordis-плагин. Регистрирует DeepSeek ASR во встроенном
 * экспериментальном Voice input через ctx.speechToText; своего UI нет.
 */
export const name = 'deepseek-asr-provider'
export const inject = ['speechToText', 'credentials']

export function apply(ctx: any, rawConfig: any = {}) {
  const config = normalizeConfig(rawConfig)
  const provider = createProvider(ctx, config)
  ctx.effect(() => ctx.speechToText.register(provider), 'deepseek-asr: provider')
}
