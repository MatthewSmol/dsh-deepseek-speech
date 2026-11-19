import test from 'node:test'
import assert from 'node:assert/strict'
import { mcpStatus } from '../dist/lib/mcp.js'

test('MCP SDK is importable', async () => {
  const status = await mcpStatus()
  assert.equal(status.endpoint, '/deepseek-speech/mcp')
  assert.equal(status.serverName, 'deepseek_speech')
  assert.equal(status.available, true)
  assert.equal(status.error, null)
})
