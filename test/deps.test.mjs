import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDeps } from '../dist/lib/deps.js'

test('global ffmpeg/ffprobe/libopus are detected', async (t) => {
  const deps = await resolveDeps()
  if (!deps.ffmpeg.found || !deps.ffprobe.found) {
    t.skip('ffmpeg/ffprobe unavailable')
    return
  }
  assert.equal(deps.ffmpeg.found, true)
  assert.equal(deps.ffprobe.found, true)
  assert.equal(deps.libopus, true)
  assert.match(deps.ffmpeg.version || '', /ffmpeg version/i)
})
