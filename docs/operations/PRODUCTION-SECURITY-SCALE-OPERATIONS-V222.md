# V222 Operations

## Required production setting
`TRUST_RATE_LIMIT_BACKEND=shared`

A distributed store implementation must call `configureSharedRateLimitStore()` during server bootstrap. Do not treat the in-memory fallback as safe for horizontally scaled production.

## Gates
Run:
- `npm run endpoint-auth-matrix-v222`
- `npm run query-scale-audit-v222`
- `npm run secret-scan-v222`
- `npm run security-audit-v221`
- `npm run financial-security-audit-v221`
- `npm test`

## Load testing
Keep external traffic disabled by default. The V221 load harness remains dry-run unless an authorized staging `LOAD_TEST_TARGET` is explicitly supplied.
