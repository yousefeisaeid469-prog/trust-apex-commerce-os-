# TRUST APEX OS — V324.0.0

V324 activates dormant customer-commerce capabilities with executable database-backed behavior instead of adding another audit-only layer.

### Included
- Real wishlist API backed by `trust_marketplace_wishlists`.
- Real loyalty account reads and order-derived earning.
- Delivered-order ownership checks.
- Configurable loyalty policy via `TRUST_LOYALTY_POINTS_PER_100_EGP`.
- Idempotency, row locking, transaction boundaries and outbox event emission.
- Migration 162 with supporting indexes.

### Reality boundary
Source-level and syntax verification were run in the archive. A live PostgreSQL integration test and external provider E2E require deployment credentials/infrastructure and are intentionally not represented as PASS here.
