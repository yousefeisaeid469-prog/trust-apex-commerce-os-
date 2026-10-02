# TRUST V279.0.0 — Customer Retention & Trust

V279 activates customer retention surfaces that were previously foundation-only: reviews with verified-purchase evidence, wishlist state, price alerts, and a durable loyalty points ledger.

## Product runtime
- Product reviews are persisted and ranked with verified-purchase and helpful-vote signals.
- Wishlists and price alerts are customer-scoped and durable in PostgreSQL.
- Loyalty accounts and idempotent points awards are durable and customer-scoped.
- Product pages expose review quality signals plus wishlist and price-alert actions.
- All customer mutations require the authenticated customer session; no client-supplied customer identity is trusted.

## Verification
- V279 targeted tests cover review verification, wishlist/price-alert ownership, and idempotent loyalty awards.
- Migration manifest regenerated with canonical migrations 001–117.
- TypeScript compiler/Next production build require installed dependencies and are not claimed here.
