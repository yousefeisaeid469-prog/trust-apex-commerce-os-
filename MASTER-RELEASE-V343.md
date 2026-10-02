# TRUST V343 — Seller Operations Bridge

Version: `343.0.0`

This release connects the seller-order aggregate to physical fulfillment and seller-level financial operations.

### Implemented
- `trust_marketplace_fulfillment_orders.seller_order_id`
- seller-order-aware fulfillment creation
- seller-order delivery closure from delivered fulfillment
- seller-order financial allocation
- seller-order payout allocation limits
- merchant seller-order operations endpoint
- V342 order-item backfill

### Verification
12 regression/source tests passed across V333, V337, V338, V339, V340, V341, V342 and V343.

### Explicit limitation
No claim is made that external payment, carrier or live PostgreSQL production integrations are verified until those dependencies are configured and exercised.
