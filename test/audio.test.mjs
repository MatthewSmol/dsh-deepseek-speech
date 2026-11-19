import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveDeps, runCommand, toOggOpus, probeAudio, qualityArgs } from '../lib/deps.js'
import { billedChars, estimateTokens } from '../lib/deepseek.js'
import { prepareSpeechText } from '../lib/speech.js'

test('quality presets produce OGG/Opus arguments', () => {
  const cbr = qualityArgs('128')
  assert.equal(cbr.bitrateKbps, 128)
  assert.ok(cbr.args.includes('128k'))
  assert.ok(cbr.args.includes('off'))
  const dynamic = qualityArgs('dynamic')
  assert.equal(dynamic.bitrateKbps, null)
  assert.ok(dynamic.args.includes('256k'))
  assert.ok(dynamic.args.includes('on'))
  assert.ok(dynamic.args.includes('ogg'))
})

test('billed characters and token estimate', () => {
  assert.equal(billedChars('abc中文'), 7)
  assert.equal(estimateTokens('12345678'), 2)
})

test('speech text strips code, links and markdown', () => {
  const out = prepareSpeechText('Hello **world**\n```js\nconst x = 1\n```\nhttps://example.com')
  assert.equal(out.includes('const'), false)
  assert.equal(out.includes('https://'), false)
  assert.equal(out.includes('**'), false)
  assert.ok(out.includes('Hello'))
})

test('ffmpeg can produce and probe OGG/Opus', async (t) => {
  const deps = await resolveDeps()
  if (!deps.ok) {
    t.skip('ffmpeg/ffprobe/libopus unavailable')
    return
  }
  const dir = await mkdtemp(join(tmpdir(), 'dsh-deepseek-speech-test-'))
  try {
    const wav = join(dir, 'tone.wav')
    const ogg = join(dir, 'tone.ogg')
    const gen = await runCommand(deps.ffmpeg.path, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=0.4',
      '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav,
    ], { timeoutMs: 30000 })
    assert.equal(gen.code, 0, gen.stderr)
    const result = await toOggOpus(deps.ffmpeg.path, wav, ogg, '64')
    assert.equal(result.quality.bitrateKbps, 64)
    const info = await probeAudio(ogg, deps.ffprobe.path)
    assert.equal(info.codec, 'opus')
    assert.ok(info.durationMs >= 300, `duration ${info.durationMs}`)
    assert.ok((await stat(ogg)).size > 100)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
