# TRUST V106 — REAL DATA PLATFORM FOUNDATION

## Delivered
- PostgreSQL production schema for merchants, customers, products, inventory, orders, payments, outbox events and audit logs.
- Provider-agnostic SQL client / transaction contract.
- Domain invariants and ID utilities.
- Idempotency-key replay/conflict foundation.
- Outbox event queue foundation and event API.
- Data Core metrics API exposing repository/database/event modes.
- V106 package/version metadata.

## Production activation
The application intentionally remains runnable without a database. Set `DATABASE_URL` and connect the `ProductionStore` adapter through the chosen PostgreSQL provider/migration runner before production writes are enabled.

## Safety
No fake claim of live PostgreSQL, live payments, or production event delivery is made by this release.
