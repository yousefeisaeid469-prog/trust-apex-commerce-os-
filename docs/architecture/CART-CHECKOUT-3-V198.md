# TRUST V198 — Cart + Checkout 3.0

V198 hardens the customer path from local cart state to a server-authoritative checkout boundary.

## Delivered
- Canonical cart line normalization and quantity bounds.
- One shipping policy in `modules/commerce/cart/experience-3.ts`.
- Server checkout preview that re-reads active catalog price and stock.
- Explicit price-change and stock-change recovery states in the storefront shell.
- Checkout commit ignores client-supplied shipping and calculates it from server-side prices.
- PostgreSQL transaction advisory lock serializes requests sharing an idempotency key.
- Existing order/idempotency protections remain in the commit transaction.
- Mobile cart controls preserve 44px touch targets and safe-area behavior.

## Boundary
The current UI defaults to cash on delivery. Card checkout remains a pending-payment boundary and still requires a configured external payment provider for real authorization/capture.

V198 does not claim live payment-provider execution, production traffic, browser E2E, or a live carrier integration.
