import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handler, findOpenings } from './handler.mjs'

const call = (routeKey, extra = {}) => handler({ routeKey, ...extra })

test('GET /health reports the deployed version', async () => {
  process.env.APP_VERSION = 'abc123'
  const res = await call('GET /health')
  assert.equal(res.statusCode, 200)
  assert.deepEqual(JSON.parse(res.body), { status: 'ok', version: 'abc123' })
})

test('GET /health falls back to dev when no version is injected', async () => {
  delete process.env.APP_VERSION
  const res = await call('GET /health')
  assert.equal(JSON.parse(res.body).version, 'dev')
})

test('GET /openings returns every opening by default', async () => {
  const res = await call('GET /openings')
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).items.length, findOpenings().length)
})

test('GET /openings filters by company, case-insensitively', async () => {
  const res = await call('GET /openings', { queryStringParameters: { company: 'acme analytics' } })
  const { items } = JSON.parse(res.body)
  assert.equal(items.length, 2)
  assert.ok(items.every((o) => o.company === 'Acme Analytics'))
})

test('GET / serves the web page', async () => {
  const res = await call('GET /')
  assert.equal(res.statusCode, 200)
  assert.match(res.headers['content-type'], /^text\/html/)
  assert.match(res.body, /IIM Placement Openings/)
})

test('unknown routes return 404', async () => {
  const res = await call('GET /nope')
  assert.equal(res.statusCode, 404)
})
