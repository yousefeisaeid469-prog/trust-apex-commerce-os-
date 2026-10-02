# TRUST V275.0.0 — Seller Trust Intelligence

V275 adds a durable seller-performance graph and a confidence-bounded trust score used by Buy Box selection.

## Product runtime
- Durable seller performance facts and idempotent performance events.
- Existing marketplace truth is bootstrapped without inventing unknown dimensions.
- Buy Box now incorporates seller trust while preserving landed-cost deterministic tie-breaking.
- Checkout records a real seller ORDER_ACCEPTED fact for offer-backed orders.
- Public seller trust summary endpoint: `/api/marketplace/sellers/{merchantId}/trust`.

## Verification
- V275 targeted tests: 5/5 PASS.
- Migration manifest regenerated with canonical migrations 001–113.
- TypeScript compiler/Next production build require installed dependencies and are not claimed here.
