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

test('GET / serves the Placement Board page', async () => {
  const res = await call('GET /')
  assert.equal(res.statusCode, 200)
  assert.match(res.headers['content-type'], /^text\/html/)
  assert.match(res.body, /Placement Cell/)
})

test('the page assets are served with the right content types', async () => {
  const js = await call('GET /app.js')
  const css = await call('GET /styles.css')
  assert.match(js.headers['content-type'], /^text\/javascript/)
  assert.match(css.headers['content-type'], /^text\/css/)
  assert.ok(js.body.length > 1000 && css.body.length > 1000)
})

test('unknown routes return 404', async () => {
  const res = await call('GET /nope')
  assert.equal(res.statusCode, 404)
})
