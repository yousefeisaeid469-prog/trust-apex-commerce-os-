# TRUST V316 — Marketplace OS Vertical Slice

V316 connects the marketplace business lifecycle as one explicit workflow contract:
Tenant → Seller → Catalog → Inventory → Order → Payment → Fulfillment → Finance → Analytics.

## What is real in this release
- Deterministic command validation and workflow planning.
- Exact minor-unit money arithmetic with BigInt.
- Seller commission calculation and seller-net calculation.
- Stable workflow fingerprint derived from the command.
- Idempotent durable run storage and event storage in PostgreSQL.
- Transactional checks for active tenant, verified seller, active offer, ownership and stock.
- API entry point for the workflow.
- Nine explicit lifecycle stages with transition tracking.

## Boundary
V316 does not claim that a live PostgreSQL instance, payment provider, carrier, or external marketplace is connected. The runtime is designed to execute against PostgreSQL, while the release evidence in this artifact is local/sandbox verification.

## Design rule
The slice orchestrates existing commerce/payment/fulfillment/finance capabilities instead of creating another parallel copy of those systems. Future versions should attach real order/payment/fulfillment commands behind these stage boundaries and preserve the idempotency and evidence contracts.
