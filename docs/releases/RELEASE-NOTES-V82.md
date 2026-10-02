# TRUST V82 — Transactional Commerce & Payments Foundation

## Major release
- Transactional-style inventory reservation boundary separated from order service.
- Commerce event stream for order creation, status changes, and payment outcomes.
- Idempotency keys for payment intent creation and webhook processing.
- Payment Intent adapter with explicit status lifecycle; no real payment provider is claimed.
- Customer checkout-from-cart endpoint.
- Merchant order summary endpoint.
- Order status transitions now emit auditable commerce events.

## Production boundary
The payment adapter is intentionally provider-neutral. A real payment provider, webhook signature verification, durable PostgreSQL persistence, and distributed locking must be configured before live payments.
