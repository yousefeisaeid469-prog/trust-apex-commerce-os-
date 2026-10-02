# TRUST V281.0.0 — Promotion Correctness & Dynamic Pricing Hardening

V281 repairs V280 promotion accounting and turns promotion lifecycle, dynamic-price decision history, stacking policy, and validation into runtime capabilities.

## Critical fixes
- Base item prices remain authoritative; deal/coupon/voucher adjustments are ledger discounts and are never subtracted twice.
- SCHEDULED promotions durably transition to ACTIVE/EXPIRED during evaluation, with a reusable lifecycle worker.
- Dynamic pricing records price decisions with rule identifiers and signal inputs.
- Coupons support explicit stacking, merchant/category scope, first-order eligibility, customer segments, and shipping discounts.
- Marketplace growth API syntax is repaired.
- Historical V261 evidence artifacts remain immutable; the release gate no longer treats their historical version as a current-release mismatch.

## Verification
- V281 deterministic promotion-engine tests pass.
- Migration and version consistency checks pass.
- Full TypeScript typecheck has no remaining syntax diagnostics; dependency/type-resolution diagnostics remain because node_modules is not present in the supplied environment.
