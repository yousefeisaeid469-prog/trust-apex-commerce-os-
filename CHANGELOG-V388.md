# V388.0.0 — Global Marketplace Order OS

## Goal
Create one live order-journey read model over the existing authoritative commerce domains without introducing duplicate business truth.

## Runtime
- `modules/platform/order-journey-os/core.ts`
- `GET /api/orders/[id]/journey`

## Sources
Orders, order items, seller orders/events, payments, payment provider jobs, global payment lifecycle, fulfillment orders/events, fulfillment allocations, shipments, returns, refunds/refund settlements, payout requests, balance releases, and revenue ledger.

## Safety
Customer-scoped access is enforced at the authoritative `trust_orders.customer_id` query. Privileged operational roles may inspect any order. The read model does not mutate money, inventory, fulfillment, payout, or revenue state.

## Migration
214 adds only supporting indexes. No duplicate order/financial authority is introduced.
