# TRUST Data Core database

`migrations/001_core.sql` is the first PostgreSQL schema for V106.

Production checklist:
1. Provision PostgreSQL 15+ (Neon, Supabase, RDS, Cloud SQL, etc.).
2. Apply migrations through your migration runner.
3. Set `DATABASE_URL` as a server-only secret.
4. Implement/connect a `ProductionStore` adapter in `lib/data-core/db/`.
5. Enable transactions for order/inventory/payment workflows.
6. Persist the outbox transactionally with domain writes.
7. Publish outbox events asynchronously and mark them published only after acknowledgement.
8. Persist immutable audit events separately from mutable operational tables.

The application does not pretend to have a live database until a provider adapter is connected.
