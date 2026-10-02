# TRUST V280.0.0 — Deals, Coupons, Vouchers & Dynamic Pricing

V280 activates durable marketplace promotion primitives: time-bounded seller deals, customer-scoped coupons, value vouchers, price history, and bounded dynamic pricing. Promotion evaluation is server-authoritative and checkout-bound.

## Runtime
- `modules/marketplace/promotions.ts` evaluates deals, coupons, vouchers and bounded price rules.
- Checkout recomputes promotions at commit and records coupon/voucher redemption idempotently.
- Deal quantity limits are locked and incremented inside the checkout transaction.
- `/api/marketplace/promotions` provides seller-controlled deal/coupon creation and a customer-readable live-deals feed.
- `/deals` provides a customer-facing active-deals surface.

## Verification
- V280 targeted tests: 3/3 PASS.
- 118 canonical migrations pass the migration checker.
- Version consistency and release gate pass.
- A full Next production build is not claimed when project dependencies are absent from the supplied runtime environment.
