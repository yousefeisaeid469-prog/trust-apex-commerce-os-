# TRUST V221 — Production Readiness & Security

## Scope
V221 adds a production-readiness control layer covering security posture, sensitive-field encryption primitives, financial safety evidence, API inventory, deployment/operations documentation, load/stress harnesses and performance review.

## Security
- Security headers include HSTS, CSP, frame denial, MIME sniffing protection and restrictive Permissions-Policy.
- Production configuration requires database transport encryption and server-side secrets.
- AES-256-GCM field encryption is available through `TRUST_FIELD_ENCRYPTION_KEY` (32-byte base64).
- CORS uses an explicit production allowlist.
- Financial safety audit verifies BigInt minor-unit money, balanced journals, fraud scoring, revenue-ledger idempotency and evidence gates.

## Important honesty boundary
This release does **not** claim zero bugs, OWASP certification, PCI certification, SOC 2 certification, or that an application-level helper magically encrypts an entire database. Encryption at rest remains a deployment/database responsibility; the field-encryption helper is an additional application layer for selected sensitive fields.

## Scalability
`load_stress_v221.mjs` is dry-run by default. It only generates live traffic when `LOAD_TEST_TARGET` is explicitly supplied. Use an authorized staging environment first. Results report request count, error rate and p50/p95/p99 latency.

## Performance
The performance audit flags obvious query fan-out and `SELECT *` patterns for review. It does not substitute for production APM, database query plans, CDN/load-balancer telemetry or real load testing.
