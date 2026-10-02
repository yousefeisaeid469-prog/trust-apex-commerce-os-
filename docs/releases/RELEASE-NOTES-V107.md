# TRUST V107 — Commerce Transaction Engine

## Added
- PostgreSQL Pool adapter with server-only DATABASE_URL handling.
- Transactional checkout commit endpoint at `/api/checkout/commit`.
- Row-level inventory locking with `FOR UPDATE`.
- Inventory reservations with expiry.
- Transactional order + order items + inventory ledger + outbox + idempotency persistence.
- Idempotency replay protection for checkout commits.
- V107 database indexes and order status constraint migration.
- Fail-closed behavior when production database is not configured.

## Important
V107 does not claim a live production database or payment provider. Configure DATABASE_URL and run migrations before production use.
