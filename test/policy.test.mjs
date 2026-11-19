import test from 'node:test'
import assert from 'node:assert/strict'
import { wantsVoice, textOfMessage, POSITIVE_RE, NEGATIVE_RE } from '../lib/voice-reply.js'

test('positive voice triggers', () => {
  for (const text of [
    'ответь голосом',
    'Ответь голосом, пожалуйста',
    'озвучь ответ',
    'прочитай вслух',
    'voice reply please',
    'reply with voice',
    'read aloud',
  ]) assert.equal(wantsVoice(text), true, text)
})

test('negative voice triggers win', () => {
  for (const text of [
    'ответь голосом, но не озвучивай код',
    'без голоса',
    'только текстом',
    'text only',
    "don't speak",
    'no voice',
  ]) assert.equal(wantsVoice(text), false, text)
})

test('ordinary prompts do not request voice', () => {
  assert.equal(wantsVoice('просто ответь текстом'), false)
  assert.equal(wantsVoice('hello'), false)
  assert.equal(wantsVoice(''), false)
})

test('message text blocks are joined', () => {
  assert.equal(textOfMessage({ content: [
    { type: 'text', text: 'first' },
    { type: 'image', attachment: 'x' },
    { type: 'text', text: 'second' },
  ] }), 'first\nsecond')
  assert.equal(textOfMessage({ content: 'plain' }), 'plain')
  assert.equal(textOfMessage(null), '')
})

test('regexes are case-insensitive and non-global', () => {
  assert.equal(POSITIVE_RE.test('VOICE REPLY'), true)
  assert.equal(POSITIVE_RE.test('VOICE REPLY'), true)
  assert.equal(NEGATIVE_RE.test('NO VOICE'), true)
  assert.equal(NEGATIVE_RE.test('NO VOICE'), true)
})
