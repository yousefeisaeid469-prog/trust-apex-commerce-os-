# TRUST V237 — Reality Consolidation

## Goal

V237 is now split into one canonical runtime path and explicitly non-runtime legacy contracts. Production commerce state is durable PostgreSQL state; process memory and fixtures are not accepted as a production data source.

## Canonical paths

- Checkout commit: `modules/commerce/transactions/checkout.ts`
- Checkout quote state: `modules/commerce/core/engine.ts` + `trust_checkout_quotes`
- Catalog: `modules/commerce/repository/catalog.ts`
- Order transitions: `modules/commerce/orders/state.ts`
- Merchant operations: `modules/commerce/merchant-ops/service.ts`
- Merchant control plane: `modules/merchant-commerce/store.ts`
- Data-core reads: `lib/data-core/store.ts`

## Reality rules

1. No production API may read a fixture catalog or process-local order store.
2. Client-supplied shipping is never authoritative.
3. Checkout inventory mutation and order creation happen in one PostgreSQL transaction.
4. Idempotency keys are persisted and request-hash checked.
5. Quotes are durable, expiring, and single-consumption.
6. Merchant inventory changes are ownership-checked, row-locked, and ledgered.
7. Demo/simulation surfaces must be labelled or fail closed; they must never claim LIVE.
8. Provider-dependent capabilities remain `PROVIDER_REQUIRED` until a real provider is configured and certified.

## Production surface matrix

| Capability | Persistence | Transactional | External dependency | Release state |
|---|---|---:|---|---|
| Product catalog | PostgreSQL | Yes | No | LIVE |
| Checkout | PostgreSQL | Yes | Payment provider for card | LIVE/COD; provider-gated card |
| Inventory reservation | PostgreSQL | Yes | No | LIVE |
| Merchant inventory adjustment | PostgreSQL | Yes | No | LIVE |
| Merchant order views | PostgreSQL | Read-consistent | No | LIVE |
| Checkout quotes | PostgreSQL | Yes | No | LIVE |
| Subscriptions | — | — | Provider | PROVIDER_REQUIRED |
| B2B | — | — | Provider/business integration | FOUNDATION |
| Gift cards | — | — | Provider | FOUNDATION |

## Known boundary

A source-level audit cannot certify external provider credentials, live payment webhooks, network latency, database HA, backups, or production traffic behavior. Those require deployment-time verification. The release gate therefore treats them as evidence requirements rather than pretending source code can prove them.
