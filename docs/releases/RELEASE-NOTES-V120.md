# TRUST V120 — Production Hardening & Operations OS

V120 adds the production-readiness layer requested for a serious commerce platform.

## 1. Production Hardening & Security
- Global API rate limiting with stricter buckets for high-impact surfaces.
- Strict production CORS allowlist using `TRUST_ALLOWED_ORIGINS`.
- Central security headers and Origin enforcement middleware.
- Existing payment webhook HMAC verification retained as a hard requirement.
- Security/compliance audit baseline documented.

## 2. Monetization & Developer Docs
- External integration/API contract documentation.
- SDK directory contract and versioning guidance.
- Multi-tenant merchant onboarding lifecycle contract.
- Onboarding workflow endpoint and monotonic stage transitions.

## 3. Observability & Incident Management
- Admin-only operations surface at `/ops`.
- Admin-only telemetry endpoint at `/api/ops/telemetry`.
- In-process telemetry snapshot foundation.
- External incident webhook adapter via `TRUST_INCIDENT_WEBHOOK_URL`.

## 4. Disaster Recovery
- PostgreSQL backup/PITR, restore, migration and invariant-validation runbook.
- Zero-downtime deployment guidance based on expand/contract migrations and health-gated rollout.

## 5. Load & Stress Testing
- `scripts/load-tests/api-concurrency.mjs` for configurable concurrent API smoke/stress testing.
- Use `BASE_URL`, `PATH_TO_TEST`, `CONCURRENCY`, and `ROUNDS` environment variables.

## Production caveats
Rate limiting and telemetry are intentionally safe in-memory foundations. Multi-instance production must use shared Redis/KV and centralized observability. V120 does not claim a real PagerDuty connection until `TRUST_INCIDENT_WEBHOOK_URL` is configured and tested. V120 also does not claim zero-downtime recovery merely from documentation.
