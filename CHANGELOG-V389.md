# V389.0.0 — Customer Post-Purchase OS

## Goal
Unify post-purchase customer state and enforce real delivery-based eligibility for reviews and loyalty.

## Runtime
- Added `modules/customer-experience/post-purchase-os.ts` live read model.
- Added `GET /api/customer/post-purchase` for account-scoped overview and eligibility queries.
- Added `/customer/post-purchase` live customer surface.
- Review verification now uses canonical `trust_orders` / `trust_order_items` and requires `delivered` status.
- Delivery completion awards loyalty points exactly once using `delivery-loyalty:{orderId}` idempotency.
- Loyalty account mutation only occurs when the ledger insert wins the idempotency race.

## Database
- Added migration 215 with read-path indexes only.

## Validation
- V389 audit: 12/12.
- V389 test: 4/4.
- No live PostgreSQL E2E claim.
