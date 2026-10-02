# TRUST V83 — Persistent Transactional Commerce

V83 expands the commerce foundation with production-oriented persistence contracts.

## Included
- PostgreSQL idempotency records with scoped keys and expiry.
- Transactional order creation with row locks, stock checks and inventory ledger writes.
- Outbox event records for reliable asynchronous publishing.
- Payment webhook signature verification and provider-event deduplication.
- Inventory reservation schema.
- Order shipping-address persistence and validation for Egyptian phone numbers.
- Tamper-evident audit-chain persistence schema.

## Important
The SQL layer is an integration boundary. A real PostgreSQL connection, provider credentials, migrations, webhook endpoint configuration and operational monitoring must be supplied before accepting production traffic.
