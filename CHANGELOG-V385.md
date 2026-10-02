# V385.0.0 — Commercial Journey Unification

## Purpose
Connect the customer-facing purchase journey to the existing production commerce authorities instead of adding another demo surface.

## Implemented
- Added `modules/commerce/journey/commercial-journey.ts` as a read-only journey coordinator over the canonical cart state.
- Added `GET /api/commerce/journey` for live cart/checkout readiness, blockers, item count and seller count.
- Added `/cart` customer surface with live cart items, quantity mutation, stock/offer validation feedback and checkout gating.
- Added `/checkout` customer surface using the existing server-side quote and cart-commit authorities.
- Checkout uses an idempotency key and explicitly exposes the current COD order path; it does not pretend card payment is implemented here.

## Validation
- V385 commercial journey audit: expected 15/15 checks.
- V385 commercial journey test: expected 10/10 checks.
- No database migration required.
- Full TypeScript/build/live PostgreSQL execution still requires the project's installed dependencies and configured database.
