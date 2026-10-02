# V387 — Fulfillment Delivery Unification

- Added a durable `fulfillment_order_id` binding on customer-facing shipments.
- Added shipment creation idempotency for fulfillment-created shipments.
- Fulfillment orders now create/bind their shipment when reaching `READY_FOR_HANDOFF`.
- Carrier handoff advances the bound shipment to `PICKED_UP` when a label exists.
- Delivery remains gated on the exact bound shipment reaching `DELIVERED`.
- Multi-seller orders now aggregate shipment states before changing the customer-facing order status.
- A single delivered seller shipment no longer marks a multi-shipment order delivered prematurely.
- Existing legacy order-level shipments remain supported through the nullable binding.
