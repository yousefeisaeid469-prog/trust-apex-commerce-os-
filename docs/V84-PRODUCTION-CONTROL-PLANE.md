# TRUST V84 — Production Control Plane

V84 closes several operational gaps without pretending external infrastructure is already connected.

## Added
- Server-only environment contract and production configuration check.
- Shared-store migration boundary for rate limiting; memory fallback is explicitly development-only.
- Version and configuration health endpoints.
- PostgreSQL operational indexes for idempotency, payment replay protection, orders, inventory, outbox and audit queries.

## Production gates
1. Provision PostgreSQL and apply migrations.
2. Configure secrets through the hosting provider; never commit them.
3. Replace memory sessions/idempotency/rate limiting with shared persistent adapters.
4. Connect a real payment provider and verify webhook signatures using provider documentation.
5. Run install, typecheck, lint and `next build` in CI.
6. Run end-to-end checkout, payment, refund and fulfillment tests against staging.
7. Promote only after database backups, monitoring and rollback procedures are verified.
