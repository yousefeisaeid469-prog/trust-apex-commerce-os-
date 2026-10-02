# TRUST V221 — Deployment & Operations Guide

## Required production environment
- `DATABASE_URL` with `sslmode=require` or `TRUST_DB_SSL=true`
- `TRUST_SESSION_SECRET`
- `TRUST_WEBHOOK_SECRET`
- `TRUST_ALLOWED_ORIGINS` as a comma-separated explicit allowlist
- `TRUST_FIELD_ENCRYPTION_KEY` as base64 for exactly 32 random bytes when encrypted application fields are used
- Optional `DATABASE_POOL_MAX`, `TRUST_DB_SSL_REJECT_UNAUTHORIZED`

## Release sequence
1. Run `npm ci`.
2. Run `npm test`.
3. Run `npm run security-audit-v221`.
4. Run `npm run financial-security-audit-v221`.
5. Run `npm run api-docs` and `npm run api-docs-check`.
6. Run `npm run performance-audit-v221`.
7. Run `npm run load-stress-v221` against authorized staging with explicit target/concurrency/duration.
8. Run migration/contract/preflight/release gates.
9. Deploy behind TLS and a managed database with encryption at rest enabled.

## Incident controls
- Preserve `X-Request-Id` for correlation.
- Keep provider webhooks signed and replay-protected.
- Treat missing adapters/credentials as explicit failures, never as successful delivery.
- Do not paste secrets into logs or issue trackers. Rotate compromised secrets immediately.

## Ads and operations
Campaign execution remains provider-specific. V221 documents the operational boundary but does not invent advertising credentials or claim live ad execution.
