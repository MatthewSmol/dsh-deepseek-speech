import assert from 'node:assert/strict'
import test from 'node:test'
import { createProvider } from '../dist/index.js'

function wav(seconds = 0.5) {
  const samples = Math.max(1, Math.round(16000 * seconds))
  const bytes = Buffer.alloc(44 + samples * 2)
  bytes.write('RIFF', 0, 'ascii')
  bytes.writeUInt32LE(bytes.length - 8, 4)
  bytes.write('WAVE', 8, 'ascii')
  bytes.write('fmt ', 12, 'ascii')
  bytes.writeUInt32LE(16, 16)
  bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(1, 22)
  bytes.writeUInt32LE(16000, 24)
  bytes.writeUInt32LE(32000, 28)
  bytes.writeUInt16LE(2, 32)
  bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36, 'ascii')
  bytes.writeUInt32LE(bytes.length - 44, 40)
  return new Uint8Array(bytes)
}

function ctxFor(key = 'test-key') {
  return {
    credentials: {
      async resolve(name) {
        assert.equal(name, 'DEEPSEEK_API_KEY')
        return key
      },
    },
  }
}

test('metadata exposes Russian and English', () => {
  const provider = createProvider(ctxFor(), {})
  assert.equal(provider.info.name, 'DeepSeek ASR')
  assert.equal(provider.info.location, 'cloud')
  assert.deepEqual(provider.info.languages, ['auto', 'ru', 'en'])
  assert.equal(provider.preparation, undefined)
})

test('transcribes canonical WAV with the existing key', async () => {
  const original = globalThis.fetch
  let captured
  globalThis.fetch = async (url, init) => {
    captured = { url, init }
    return new Response(JSON.stringify({ text: 'привет мир', request_id: 'req_1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  try {
    const provider = createProvider(ctxFor(), {})
    const result = await provider.transcribe({ audio: wav(0.5), language: 'ru' })
    assert.equal(result.text, 'привет мир')
    assert.equal(result.audioSeconds, 0.5)
    assert.ok(result.inferenceSeconds >= 0)
    assert.equal(captured.url, 'https://api.deepseek.com/v1/tools/asr')
    assert.equal(captured.init.headers.Authorization, 'Bearer test-key')
    assert.ok(captured.init.body instanceof FormData)
    const file = captured.init.body.get('file')
    assert.equal(file.type, 'audio/wav')
    assert.ok((await file.arrayBuffer()).byteLength > 44)
  } finally {
    globalThis.fetch = original
  }
})

test('rejects missing key before fetch', async () => {
  const provider = createProvider(ctxFor(''), {})
  await assert.rejects(
    provider.transcribe({ audio: wav(0.2), language: 'ru' }),
    /API key is not configured/,
  )
})

test('surfaces HTTP errors without leaking the key', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'unauthorized' } }), { status: 401 })
  try {
    const provider = createProvider(ctxFor('sk-secret-value'), {})
    await assert.rejects(
      provider.transcribe({ audio: wav(0.2), language: 'ru' }),
      (err) => err.message.includes('unauthorized') && !err.message.includes('sk-secret-value'),
    )
  } finally {
    globalThis.fetch = original
  }
})

test('rejects malformed WAV before fetch', async () => {
  const provider = createProvider(ctxFor(), {})
  await assert.rejects(
    provider.transcribe({ audio: new Uint8Array([1, 2, 3]), language: 'ru' }),
    /canonical 16 kHz/,
  )
})

test('rejects empty transcripts', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ text: '   ' }), { status: 200 })
  try {
    const provider = createProvider(ctxFor(), {})
    await assert.rejects(
      provider.transcribe({ audio: wav(0.2), language: 'en' }),
      /empty transcript/,
    )
  } finally {
    globalThis.fetch = original
  }
})

test('rejects oversized recordings before validation', async () => {
  const provider = createProvider(ctxFor(), {})
  await assert.rejects(
    provider.transcribe({ audio: new Uint8Array(8 * 1024 * 1024 + 1), language: 'auto' }),
    /exceeds 8388608 bytes/,
  )
})
