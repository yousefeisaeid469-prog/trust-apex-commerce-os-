# V322 — Seller Services + B2B + Membership Revenue Wiring

V322 is additive and implementation-focused. It adds durable revenue execution for seller services, approved B2B service charges, and customer membership renewal billing events.

## Delivered
- Seller-service order table and transactional purchase path.
- Unified `trust_revenue_ledger` posting under `SELLER_SERVICES`.
- Merchant finance `FEE` transaction for seller-service purchases.
- Approved-B2B-only service charge path under `B2B` revenue.
- Customer membership renewal billing event path under `SUBSCRIPTION` revenue.
- Idempotency and row locking for all new financial writes.
- APIs for seller services, B2B service charges, and membership renewal.

## Reality boundary
These internal financial records are durable database execution. External payment collection/provider settlement is still dependent on configured provider adapters and verified webhooks. No provider secret is embedded in source.
