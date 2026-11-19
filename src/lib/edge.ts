/**
 * EN: Edge TTS provider. Uses the unofficial Microsoft Read Aloud WebSocket
 * through `msedge-tts`, selects RU/EN neural voices, escapes SSML input and
 * returns MP3 bytes. No API key is required.
 * RU: Провайдер Edge TTS. Использует неофициальный Microsoft Read Aloud
 * WebSocket через `msedge-tts`, выбирает русские/английские нейроголоса,
 * экранирует SSML и возвращает MP3. API-ключ не нужен.
 */
import { Buffer } from 'node:buffer'

export const EDGE_VOICES = {
  stella: { ru: 'ru-RU-SvetlanaNeural', en: 'en-US-AriaNeural' },
  tide: { ru: 'ru-RU-DmitryNeural', en: 'en-US-GuyNeural' },
}

const EDGE_FORMATS = [
  { bitrateKbps: 96, value: 'AUDIO_24KHZ_96KBITRATE_MONO_MP3' },
  { bitrateKbps: 48, value: 'AUDIO_24KHZ_48KBITRATE_MONO_MP3' },
]

let edgeModulePromise = null

/**
 * EN: Dynamic import keeps the plugin loadable even when the optional Edge
 * package is absent.
 * RU: Динамический импорт позволяет плагину загружаться даже без Edge-пакета.
 */
export async function loadEdgeModule() {
  if (!edgeModulePromise) {
    edgeModulePromise = import('msedge-tts').catch((err) => {
      edgeModulePromise = null
      throw new Error(`msedge-tts is not installed: ${err.message}`)
    })
  }
  return edgeModulePromise
}

export async function edgeStatus() {
  try {
    await loadEdgeModule()
    return { available: true, error: null }
  } catch (err) {
    return { available: false, error: err.message }
  }
}

const CYRILLIC = /[\u0400-\u052F]/u
const LATIN = /[A-Za-z]/u

export function detectSpeechLanguage(text, forced = 'auto') {
  const mode = String(forced || 'auto').toLowerCase()
  if (mode === 'ru' || mode === 'en') return mode
  let ru = 0
  let en = 0
  for (const ch of String(text || '')) {
    if (CYRILLIC.test(ch)) ru += 1
    else if (LATIN.test(ch)) en += 1
  }
  return en > ru ? 'en' : 'ru'
}

export function edgeVoiceFor(voiceId, language) {
  const voice = EDGE_VOICES[voiceId === 'tide' ? 'tide' : 'stella']
  return language === 'en' ? voice.en : voice.ru
}

export function escapeXml(text) {
  return String(text || '').replace(/[<>&"']/g, (ch) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  }[ch]))
}

/**
 * EN: Collects a Node Readable into one Buffer and enforces a hard timeout.
 * RU: Собирает Node Readable в один Buffer и ограничивает время ожидания.
 */
function collectStream(audioStream: any, timeoutMs: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let settled = false
    const finish = (err?: any) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) reject(err)
      else resolve(Buffer.concat(chunks))
    }
    const timer = setTimeout(() => finish(new Error('Edge TTS synthesis timed out')), Math.max(1000, timeoutMs))
    audioStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    audioStream.on('end', () => finish())
    audioStream.on('close', () => finish())
    audioStream.on('error', (err) => finish(err))
  })
}

export async function synthesizeEdgeMp3({ text, voiceId = 'stella', language = 'auto', timeoutMs = 60000 }: { text: string; voiceId?: string; language?: string; timeoutMs?: number }): Promise<any> {
  const input = String(text || '').trim()
  if (!input) throw new Error('Nothing to synthesize')
  const lang = detectSpeechLanguage(input, language)
  const voice = edgeVoiceFor(voiceId, lang)
  const { MsEdgeTTS, OUTPUT_FORMAT } = await loadEdgeModule()
  let lastError = null
  // EN: 96 kbps is preferred; 48 kbps is the compatibility fallback.
  // RU: Предпочтителен 96 кбит; 48 кбит — совместимый fallback.
  for (const format of EDGE_FORMATS) {
    const tts = new MsEdgeTTS({
      connectionTimeoutMs: 10000,
      synthesisTimeoutMs: timeoutMs,
    })
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT[format.value])
      const { audioStream } = tts.toStream(escapeXml(input))
      const bytes = await collectStream(audioStream, timeoutMs)
      if (!bytes.length) throw new Error('Edge TTS returned empty audio')
      return {
        bytes,
        mime: 'audio/mpeg',
        language: lang,
        edgeVoice: voice,
        sourceBitrateKbps: format.bitrateKbps,
      }
    } catch (err) {
      lastError = err
    } finally {
      try { await tts.close() } catch { /* best effort */ }
    }
  }
  throw lastError || new Error('Edge TTS failed')
}
