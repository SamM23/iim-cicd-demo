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

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "${base}/does-not-exist")"
[ "${code}" = "404" ] || { echo "::error::unknown route returned ${code}, expected 404"; exit 1; }
echo "ok: unknown route returns 404"
