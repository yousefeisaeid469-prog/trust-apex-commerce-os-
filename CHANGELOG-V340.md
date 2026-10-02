# TRUST V340 — End-to-End Order Tracking & Fulfillment Detail

V340 turns the post-checkout journey into a single server-authoritative read path.

## Real implementation
- Customer tracking API: `/api/customer/orders/[id]/tracking`
- Merchant fulfillment detail API: `/api/merchant/fulfillment/[id]`
- Merchant fulfillment transitions remain ownership-checked, transactional and idempotent.
- Order tracking now includes seller/offer identity, payments, order history, shipments, fulfillment orders and fulfillment event history.
- Customer order detail surface now renders seller and shipment/tracking information.
- Added targeted PostgreSQL indexes for order/shipment/fulfillment timelines.

## Integrity
- Customer access is checked against `trust_orders.customer_id`.
- Merchant access is checked against `trust_marketplace_fulfillment_orders.merchant_id`.
- No fixture or in-memory tracking state is introduced.
