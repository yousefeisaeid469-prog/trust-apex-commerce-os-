# V281 — Promotion Correctness & Dynamic Pricing Hardening

- Fixed P0 double-discount accounting: subtotal is now based on authoritative effective/base unit prices and all promotion adjustments are deducted exactly once.
- Added durable SCHEDULED → ACTIVE → EXPIRED lifecycle evaluation and worker.
- Added dynamic-price decision history with rule id and input signals.
- Added explicit coupon stacking policies, merchant/category scope, first-order eligibility, customer segments and shipping discounts.
- Added deterministic promotion-engine tests covering deal math, stacking and dynamic pricing.
- Fixed the V280 marketplace-growth TypeScript syntax error.
- Kept V261 reality evidence artifacts immutable while removing false current-version mismatch semantics.
- Expanded the deals page in V281 follow-up work.
