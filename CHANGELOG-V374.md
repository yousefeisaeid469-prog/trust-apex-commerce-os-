# TRUST V374 — Unified Commerce OS

V374 is a platform-wide operational jump: a single live read model now observes the existing commerce authorities through one unified runtime/API/surface instead of creating another disconnected subsystem.

## Unified operational model
- Orders
- Payments
- Inventory reservations
- Seller orders
- Fulfillment orders
- Shipments / delivery
- Commerce events and deliveries
- Commerce execution jobs
- Revenue ledger

## Runtime
- `modules/platform/unified-commerce-os/core.ts`
- `GET /api/commerce/os/overview`
- `/unified-commerce-os`

## Reliability integration
The surface consumes V373 recovery evidence and stale-work signals but does not replace or directly mutate the authoritative order, payment, inventory, fulfillment or revenue runtimes.

## Persistence
- `trust_commerce_os_snapshots` is a durable operational projection table. It is explicitly non-authoritative.

## Verification boundary
V374 source/surface/migration smoke checks are local. Live database/provider behavior is only proven when a configured deployment exercises the runtime.
