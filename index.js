import { SettingsStore, HistoryStore } from './lib/store.js'
import { resolveDeps } from './lib/deps.js'
import { registerRoutes } from './lib/routes.js'
import { installVoiceReply } from './lib/voice-reply.js'

export const name = '@local/dsh-deepseek-speech'
export const inject = ['webServer', 'credentials']

const DEFAULTS = {
  apiKeyEnv: 'DEEPSEEK_API_KEY',
  baseUrl: 'https://api.deepseek.com',
  telegramHome: 'default',
  historyLimit: 500,
  asrChunkSeconds: 110,
  asrMaxDurationSeconds: 600,
  ffmpegPath: '',
  ffprobePath: '',
  voiceId: 'stella',
  ttsQuality: '64',
  ttsMaxChars: 4000,
  alwaysVoice: false,
  asrRatePerHour: 0.058,
  ttsRatePer10k: 0.225,
}

export function apply(ctx, rawConfig = {}) {
  const config = { ...DEFAULTS, ...(rawConfig || {}) }
  const logger = ctx.logger
  const settingsDefaults = {
    alwaysVoice: Boolean(config.alwaysVoice),
    voiceId: config.voiceId === 'tide' ? 'tide' : 'stella',
    ttsQuality: config.ttsQuality,
    ttsMaxChars: config.ttsMaxChars,
    telegramHome: config.telegramHome,
  }
  const settings = new SettingsStore(settingsDefaults, logger)
  const history = new HistoryStore(config.historyLimit, logger)

  let depsCache = null
  let depsAt = 0
  let depsPromise = null

  async function getDeps(force = false) {
    if (!force && depsCache && Date.now() - depsAt < 30000) return depsCache
    if (!force && depsPromise) return depsPromise
    depsPromise = resolveDeps(config).then((deps) => {
      depsCache = deps
      depsAt = Date.now()
      return deps
    }).finally(() => {
      depsPromise = null
    })
    return depsPromise
  }

  let routes = null
  ctx.effect(() => {
    routes = registerRoutes({
      ctx,
      config,
      settingsStore: settings,
      history,
      getDeps,
      logger,
    })
    return () => {
      try { routes?.dispose?.() } catch { /* best effort */ }
      routes = null
    }
  }, 'deepseek-speech: HTTP routes')

  ctx.effect(() => installVoiceReply({
    ctx,
    config,
    settingsStore: settings,
    history,
    getDeps,
    logger,
  }), 'deepseek-speech: Telegram voice replies')

  getDeps().then((deps) => {
    if (deps.ok) {
      logger?.info?.(`deepseek-speech: ffmpeg=${deps.ffmpeg.path} ffprobe=${deps.ffprobe.path} libopus=yes`)
    } else {
      logger?.warn?.(`deepseek-speech: dependencies incomplete (ffmpeg=${deps.ffmpeg.path || 'missing'}, ffprobe=${deps.ffprobe.path || 'missing'}, libopus=${deps.libopus})`)
    }
  }).catch((err) => logger?.warn?.(`deepseek-speech: dependency check failed: ${err.message}`))
}
