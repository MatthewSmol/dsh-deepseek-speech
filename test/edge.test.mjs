import test from 'node:test'
import assert from 'node:assert/strict'
import { detectSpeechLanguage, edgeVoiceFor, escapeXml, EDGE_VOICES } from '../lib/edge.js'

test('detects Russian and English text', () => {
  assert.equal(detectSpeechLanguage('Привет, это проверка'), 'ru')
  assert.equal(detectSpeechLanguage('Hello, this is a test'), 'en')
  assert.equal(detectSpeechLanguage('Привет hello world'), 'en')
  assert.equal(detectSpeechLanguage('12345 !!!'), 'ru')
})

test('manual language wins', () => {
  assert.equal(detectSpeechLanguage('Hello', 'ru'), 'ru')
  assert.equal(detectSpeechLanguage('Привет', 'en'), 'en')
  assert.equal(detectSpeechLanguage('Hello', 'auto'), 'en')
})

test('maps named voices to Edge IDs', () => {
  assert.equal(edgeVoiceFor('stella', 'ru'), 'ru-RU-SvetlanaNeural')
  assert.equal(edgeVoiceFor('stella', 'en'), 'en-US-AriaNeural')
  assert.equal(edgeVoiceFor('tide', 'ru'), 'ru-RU-DmitryNeural')
  assert.equal(edgeVoiceFor('tide', 'en'), 'en-US-GuyNeural')
  assert.equal(EDGE_VOICES.tide.ru, 'ru-RU-DmitryNeural')
})

test('escapes XML special characters', () => {
  assert.equal(escapeXml('a & <b> "c" \'d\''), 'a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;')
})
