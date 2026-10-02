# TRUST V85 — APEX RELEASE CANDIDATE

V85 consolidates the production hardening work from V84 and adds a final release-gate layer.

### Included
- Release/version drift cleanup across the primary UI.
- Normalized server-only environment contract and webhook secret naming.
- New `npm run release-gate` static verification.
- Production release checklist covering database, payments, security, observability, migrations and rollback.
- Preserved transactional commerce, idempotency, outbox, inventory reservation, audit and merchant/customer foundations from V83/V84.

### Important
A code archive cannot honestly be called 100% production-ready without validating the real deployment environment. V85 is therefore a Release Candidate until CI executes `npm ci`, `npm run audit`, `npm run prebuild`, and `npm run build`, and staging validates database/payment integrations.
