# TRUST V343 — Seller Operations Bridge

## Real runtime work
- Bound marketplace fulfillment orders to first-class seller orders.
- Added seller-order-aware fulfillment item selection and production journey wiring.
- Added automatic seller-order delivery closure when the bound fulfillment order and shipment are delivered.
- Added seller-order financial visibility for seller credit and released funds.
- Added seller-order payout allocations with released-funds limits.
- Added merchant-scoped seller-order operations endpoint.
- Added migration backfill for order-item seller-order ownership.

## Verification
- V343 source/regression suite: 4/4 PASS.
- Combined V333/V337/V338/V339/V340/V341/V342/V343 regression suite: 12/12 PASS.
- Full live database/provider verification is not claimed without configured production dependencies.
