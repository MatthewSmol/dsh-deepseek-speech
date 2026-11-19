import { synthesizeOgg } from './speech.js'
import { estimateTokens, ttsCostUsd, redactError } from './deepseek.js'
import { previewText } from './store.js'

export const POSITIVE_RE = /(ответь\s+голосом|ответить\s+голосом|голосов(ой|ым)\s+ответ|озвучь|прочитай\s+вслух|скажи\s+голосом|voice\s+reply|reply\s+with\s+voice|send\s+(a\s+)?voice|read\s+aloud)/i
export const NEGATIVE_RE = /(не\s+озвучивай|без\s+голоса|не\s+голосом|только\s+текстом|text\s+only|don'?t\s+speak|no\s+voice)/i

export function wantsVoice(text) {
  const value = String(text || '')
  if (!value.trim()) return false
  if (NEGATIVE_RE.test(value)) return false
  return POSITIVE_RE.test(value)
}

export function textOfMessage(message) {
  const content = message?.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

function respondedText(event) {
  if (event?.type !== 'assistant/message') return ''
  return textOfMessage(event.data?.message)
}

function makeSessionState() {
  return {
    pendingVoice: false,
    lastText: '',
    sent: false,
    timer: null,
  }
}

export function installVoiceReply({ ctx, config, settingsStore, history, getDeps, logger }) {
  const states = new Map()
  const timers = new Set()

  const clearTimer = (state) => {
    if (state?.timer) {
      clearTimeout(state.timer)
      timers.delete(state.timer)
      state.timer = null
    }
  }

  const sendVoice = async (sessionId, text) => {
    const settings = settingsStore.get()
    const started = Date.now()
    try {
      const resolved = await ctx.credentials?.resolve?.(config.apiKeyEnv)
      const key = typeof resolved === 'string' ? resolved.trim() : String(resolved?.value || '').trim()
      if (!key) throw new Error('DeepSeek API key is not configured')
      const deps = await getDeps()
      if (!deps.ok) throw new Error('ffmpeg/ffprobe/libopus are not available')
      const result = await synthesizeOgg({
        key,
        config: { ...config, ttsMaxChars: settings.ttsMaxChars },
        deps,
        text,
        voiceId: settings.voiceId,
        quality: settings.ttsQuality,
      })
      const messenger = ctx.get?.('messenger')
      if (!messenger?.send) throw new Error('Telegram messenger service is unavailable')
      await messenger.send(
        { platform: 'telegram', home: settings.telegramHome || 'default' },
        { files: [{ bytes: result.bytes, mime: 'audio/ogg', kind: 'voice', name: 'deepseek-reply.ogg' }] },
      )
      await history.add({
        kind: 'tts',
        source: 'telegram-reply',
        at: Date.now(),
        status: 'ok',
        latencyMs: Date.now() - started,
        audioDurationMs: result.durationMs,
        textChars: Array.from(result.preparedText || '').length,
        billedChars: result.billedChars,
        tokensEstimate: estimateTokens(result.preparedText || ''),
        costUsd: ttsCostUsd(result.billedChars, config.ttsRatePer10k),
        preview: previewText(result.preparedText || ''),
        sessionId,
        voiceId: settings.voiceId,
        quality: result.quality,
        bitrateKbps: result.bitrateKbps,
        chunks: 1,
      })
    } catch (err) {
      const message = redactError(err)
      logger?.warn?.(`deepseek-speech: voice reply failed: ${message}`)
      await history.add({
        kind: 'tts',
        source: 'telegram-reply',
        at: Date.now(),
        status: 'error',
        latencyMs: Date.now() - started,
        audioDurationMs: 0,
        textChars: Array.from(String(text || '')).length,
        tokensEstimate: estimateTokens(text || ''),
        costUsd: 0,
        preview: previewText(text || ''),
        error: message,
        sessionId,
        voiceId: settingsStore.get().voiceId,
        quality: settingsStore.get().ttsQuality,
        chunks: 1,
      }).catch(() => {})
    }
  }

  const onEvent = (session, event) => {
    if (!session?.id || !String(session.id).startsWith('msgw-')) return
    if (!event || typeof event.type !== 'string') return
    const id = String(session.id)
    let state = states.get(id)
    if (!state) {
      state = makeSessionState()
      states.set(id, state)
    }
    if (event.type === 'user/message') {
      const text = textOfMessage(event.data)
      if (NEGATIVE_RE.test(text)) state.pendingVoice = false
      else if (POSITIVE_RE.test(text)) state.pendingVoice = true
      state.lastText = ''
      state.sent = false
      return
    }
    if (event.type === 'assistant/message') {
      const text = respondedText(event)
      if (text) state.lastText = text
      return
    }
    if (event.type !== 'turn/end') return
    if (event.data?.reason?.kind !== 'completed') {
      clearTimer(state)
      state.pendingVoice = false
      state.lastText = ''
      return
    }
    const settings = settingsStore.get()
    const shouldSpeak = (settings.alwaysVoice || state.pendingVoice) && Boolean(state.lastText) && !state.sent
    if (!shouldSpeak) {
      state.pendingVoice = false
      state.lastText = ''
      return
    }
    state.sent = true
    const text = state.lastText
    clearTimer(state)
    const timer = setTimeout(() => {
      timers.delete(timer)
      state.timer = null
      sendVoice(id, text).catch((err) => logger?.warn?.(`deepseek-speech: voice reply error: ${err.message}`))
      state.pendingVoice = false
      state.lastText = ''
    }, 800)
    state.timer = timer
    timer.unref?.()
    timers.add(timer)
  }

  const off = ctx.on('session/event', onEvent)
  return () => {
    try { off?.() } catch { /* best effort */ }
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    for (const state of states.values()) clearTimer(state)
    states.clear()
  }
}
