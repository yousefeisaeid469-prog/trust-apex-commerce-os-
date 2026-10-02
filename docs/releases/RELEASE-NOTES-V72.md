# TRUST V72 — APEX COMMERCE ENGINE

## Focus
Production-oriented commerce correctness and a database-ready persistence boundary.

## Added
- Checkout quotes with expiry.
- Quote-to-order flow.
- Explicit order status transition rules.
- PostgreSQL-compatible baseline schema.
- Transactional inventory reservation boundary with `FOR UPDATE` locking.
- Domain-to-database separation via a SQL executor contract.
- Version bump to 72.0.0.

## Important
The default catalog/order implementation remains in-memory until a real database adapter is configured. V72 does not pretend that persistence, payments, authentication, or financial services are live without their providers.
