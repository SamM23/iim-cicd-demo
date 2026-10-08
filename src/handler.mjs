// Synthetic data only; no real placement records.
import { readFileSync } from 'node:fs'

// Original Placement Board frontend, served as-is. It keeps its data in the browser (localStorage).
const ASSETS = Object.fromEntries(
  [
    ['GET /', 'index.html', 'text/html; charset=utf-8'],
    ['GET /app.js', 'app.js', 'text/javascript; charset=utf-8'],
    ['GET /styles.css', 'styles.css', 'text/css; charset=utf-8'],
  ].map(([route, file, type]) => [route, { type, body: readFileSync(new URL(`./web/${file}`, import.meta.url), 'utf8') }]),
)

const OPENINGS = [
  { id: 'op-001', company: 'Acme Analytics', role: 'Data Analyst', ctc: '9 LPA' },
  { id: 'op-002', company: 'Acme Analytics', role: 'Product Manager', ctc: '16 LPA' },
  { id: 'op-003', company: 'Globex Retail', role: 'Operations Associate', ctc: '8 LPA' },
  { id: 'op-004', company: 'Initech Finance', role: 'Risk Analyst', ctc: '12 LPA' },
]

export const findOpenings = (company) => {
  if (!company) return OPENINGS
  const wanted = String(company).trim().toLowerCase()
  return OPENINGS.filter((o) => o.company.toLowerCase() === wanted)
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

// API Gateway HTTP API, payload format 2.0.
export const handler = async (event) => {
  const asset = ASSETS[event.routeKey]
  if (asset) {
    return {
      statusCode: 200,
      headers: { 'content-type': asset.type, 'x-content-type-options': 'nosniff' },
      body: asset.body,
    }
  }
  switch (event.routeKey) {
    case 'GET /health':
      // APP_VERSION is the git SHA injected by the pipeline; the smoke test checks it.
      return json(200, { status: 'ok', version: process.env.APP_VERSION ?? 'dev' })
    case 'GET /openings':
      return json(200, { items: findOpenings(event.queryStringParameters?.company) })
    default:
      return json(404, { error: 'not_found' })
  }
}
