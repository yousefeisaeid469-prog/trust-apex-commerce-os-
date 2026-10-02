# V342 — Durable Multi-Seller Seller Orders

## Implemented
- Added `trust_seller_orders` as a first-class seller-specific child of a customer order.
- Added merchant-scoped seller-order lifecycle and durable event history.
- Added `seller_order_id` to `trust_order_items`.
- Checkout and global checkout now create seller-order groups from actual merchant ownership and attach each order item to its seller order.
- Seller-order totals allocate item subtotal, discount proportionally, and shipment shipping by merchant.
- Added merchant APIs for listing, inspecting, and transitioning seller orders.
- Added customer API for viewing seller-order groups belonging to an authenticated order owner.
- Added transaction/advisory-lock based seller-order transitions and idempotency event keys.

## Verification
- `tests/v342-seller-order-split.test.mjs` PASS
- V333 regression PASS
- V337 regression PASS
- V338 regression PASS
- V339 regression PASS (2/2)
- V340 regression PASS
- V341 regression PASS

## Explicit limitations
- This source-level suite does not prove a live PostgreSQL deployment.
- Full Next.js/TypeScript build requires project dependencies to be installed and was not claimed as passing here.
