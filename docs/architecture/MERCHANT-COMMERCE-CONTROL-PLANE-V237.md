# V237 — Merchant Commerce Control Plane

V237 turns the merchant surface into a durable operating control plane. It introduces canonical persistence for merchant operating accounts, catalog publication, inventory balances/reservations/movements, price books and rules, promotions, payout accounts and ledger entries, tax profiles and rules, staff grants, procurement, channel synchronization, billing, risk, compliance, support, automation, forecasting, reconciliation, alerts, immutable control snapshots, and operator decisions.

## Reality contract

The control plane is database-backed and merchant-scoped. Inventory mutations use transactions and row locks, idempotency keys prevent duplicate movements, control alerts are deduplicated, and audit events are appended for operator actions. Provider-dependent capabilities such as external payouts, channel synchronization, carrier labels, and external tax services remain `PROVIDER_REQUIRED` until a configured provider is present.

## Core flow

`Merchant Identity → Operating Account → Catalog → Inventory → Pricing → Promotion → Order → Fulfillment → Payout → Reconciliation → Control Snapshot → Operator Decision`

The generic `trust_merchant_commerce_records` table is an operational projection/index only. Domain tables remain the source of truth for balances, settlements, staff grants, procurement, and other state.
