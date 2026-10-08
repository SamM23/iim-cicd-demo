#!/usr/bin/env bash
# Post-deploy check: the new version is live and the API behaves.
# Usage: bash scripts/smoke-test.sh <base-url> <expected-version>
set -euo pipefail

base="${1:?usage: smoke-test.sh <base-url> <expected-version>}"
expected="${2:?usage: smoke-test.sh <base-url> <expected-version>}"

# Lambda and the HTTP API can take a few seconds to serve the new code.
version=""
for attempt in $(seq 1 10); do
  version="$(curl -fsS --max-time 5 "${base}/health" | jq -r '.version' 2>/dev/null || true)"
  [ "${version}" = "${expected}" ] && break
  echo "attempt ${attempt}: /health reports '${version}', waiting for '${expected}'"
  sleep 3
done
if [ "${version}" != "${expected}" ]; then
  echo "::error::/health never reported version ${expected}"
  exit 1
fi
echo "ok: /health reports ${version}"

count="$(curl -fsS --max-time 5 "${base}/openings" | jq '.items | length')"
[ "${count}" -gt 0 ] || { echo "::error::/openings returned no items"; exit 1; }
echo "ok: /openings returned ${count} items"

ctype="$(curl -s -o /dev/null -w '%{content_type}' --max-time 5 "${base}/")"
case "${ctype}" in text/html*) ;; *) echo "::error::/ returned content-type '${ctype}', expected text/html"; exit 1 ;; esac
echo "ok: / serves the web page"

jstype="$(curl -s -o /dev/null -w '%{content_type}' --max-time 5 "${base}/app.js")"
case "${jstype}" in text/javascript*) ;; *) echo "::error::/app.js returned content-type '${jstype}', expected text/javascript"; exit 1 ;; esac
echo "ok: /app.js is served"

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "${base}/does-not-exist")"
[ "${code}" = "404" ] || { echo "::error::unknown route returned ${code}, expected 404"; exit 1; }
echo "ok: unknown route returns 404"
