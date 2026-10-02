# V339 — Seller Offer Management Runtime

Implemented a real merchant-owned offer control plane instead of another audit-only artifact.

- Durable offer `revision` for optimistic concurrency control.
- Merchant-scoped list endpoint with status filtering and pagination cursor.
- Merchant-scoped PATCH endpoint for price, shipping, stock, handling, delivery promise, fulfillment mode and lifecycle status.
- `SELECT ... FOR UPDATE` plus revision compare prevents lost updates.
- Durable offer change log records before/after state, actor, revision and change type.
- Offer history endpoint exposes the real persisted change history to the owning merchant.
- Existing marketplace Buy Box/checkout offer IDs remain unchanged.

Verification: `tests/v339-offer-management.test.mjs` checks the runtime, authorization boundary and concurrency guard at source level.
