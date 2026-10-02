# V326 — Commerce Journey Completion

V326 is an execution release, not an audit-only release.

## Delivered
- Durable COD collection record with one collection per order.
- Operational fulfillment preparation for existing order-shipment plans.
- Real shipment creation and tracking seed when an order shipment has no carrier shipment yet.
- Binding of marketplace fulfillment orders to physical shipment records.
- COD capture at delivery creates a real captured payment, then runs the existing economic settlement path.
- Customer-facing journey snapshot covering order, items, payments, shipments, fulfillment, settlement, COD collection, and revenue.
- Idempotency and row locking on mutation paths.
- Outbox events for fulfillment preparation and COD collection.

## Verification boundary
Source tests validate the implementation shape and SQL contracts. A live PostgreSQL run and live carrier/payment provider execution are still required for production integration verification.
