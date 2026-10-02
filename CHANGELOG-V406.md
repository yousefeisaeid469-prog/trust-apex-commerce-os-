# V406 — Global Order Journey Workflow Bridge

- Added durable WAIT_FOR_EVENT workflow steps and workflow signals.
- Added `order-journey` workflow: capture execution → wait for delivery → complete delivery.
- Payment capture creates the durable workflow in the same PostgreSQL transaction.
- Fulfillment tracking emits the delivery signal from the real shipment path.
- Workflow command handlers reuse the existing commerce execution authority; no second order/payment/inventory authority was introduced.
- Compensation selection is reversed by step index.
- Structural tests/gates added.
- Full live PostgreSQL validation is not claimed without DATABASE_URL.
