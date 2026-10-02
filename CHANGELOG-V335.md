# V335 — Guest Order Lookup Abuse Protection

## Runtime change
- Added distributed rate limiting to `GET /api/orders/lookup`.
- Limit: 10 requests per minute per client IP.
- Returns HTTP 429 with `Retry-After` and rate-limit headers when exceeded.
- In production, if `TRUST_RATE_LIMIT_BACKEND=shared` is declared but no shared store is configured, the endpoint fails closed with HTTP 503 rather than silently using per-instance memory.

## Why
Guest order lookup is intentionally available without an account when the order ID and guest phone match. That makes the endpoint an authentication boundary and a target for automated guessing. Rate limiting reduces automated enumeration and repeated verification attempts.

## Verification
- `tests/v335-order-lookup-rate-limit.test.mjs` covers the 10-request allowance and 11th-request block.
- This release does not claim a production shared-rate-limit backend until one is actually configured.
