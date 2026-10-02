# V386 — Payment Completion Fabric

- Unified checkout payment-method selection with the existing payment runtime.
- Card checkout now creates a server-authoritative payment intent after the order is created.
- Provider readiness is required before card checkout; COD remains available without an external provider.
- Fixed payment-intent creation to allow the authoritative order amount to be resolved from the order when the caller omits the optional amount assertion.
- Added order-scoped payment status reads for checkout polling.
- Checkout distinguishes pending/requires_action/captured payment states and does not claim generic provider capture.
- Reused the existing provider worker, webhook lifecycle, idempotency, and settlement authorities; no duplicate payment engine was introduced.
- No database migration required.
