# TRUST APEX OS — V222 Production Security & Scalability Hardening

V222 turns the V221 readiness checks into stronger operational controls.

## Controls
- Endpoint auth matrix: statically classifies sensitive API routes and fails the audit when a sensitive route has no detected authentication/authorization guard.
- Shared rate-limit contract: production can require a distributed backend instead of per-process memory buckets. A provider is injected through `configureSharedRateLimitStore()`.
- Query scale audit: scans application source for `SELECT *` patterns and surfaces review items.
- Secret scan: detects high-confidence embedded credentials/private-key patterns in source/config documentation.
- Security posture now requires `TRUST_RATE_LIMIT_BACKEND=shared` in production.

## Honest boundaries
The shared rate-limit module is a provider contract, not a bundled Redis service. Production must inject a real shared store. The auth matrix is static analysis and should be paired with integration tests. The query audit is heuristic and does not replace database EXPLAIN/ANALYZE. Secret scanning is heuristic and does not replace a dedicated secret-management platform.
