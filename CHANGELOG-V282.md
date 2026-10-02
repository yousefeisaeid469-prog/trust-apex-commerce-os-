# V282 — Economic Core

V282 establishes the durable economic core beneath marketplace commerce: a centralized fee engine, payment split ledger, seller balances, and return financial metadata.

## Implemented
- Unified fee calculation with referral/category/plan/volume/negotiated/min/max primitives.
- Durable fee assessments with idempotency.
- Marketplace payment ledger with seller credit, platform fee, payment fee, tax hold, refunds, chargebacks and payout primitives.
- Seller pending/available/held balance storage.
- Return financial status, disposition and refund amount.
- Durable return financial calculation records.
- Pure unified final-price composition that applies each discount exactly once.
- Deterministic economic-core tests.

## Boundary
Payment-provider settlement, carrier execution, tax-provider certification, and financial-service underwriting still require concrete external integrations and operational policies.
