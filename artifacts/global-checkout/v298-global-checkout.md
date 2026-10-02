# V298 Global Checkout Evidence

V298 promotes the V297 global commerce runtime into an authenticated checkout execution path.

- `/api/checkout/global/quote` creates a durable quote bound to country, locale, settlement currency, shipping mode, FX and tax evidence.
- `/api/checkout/global/commit` consumes the quote atomically and creates an order snapshot.
- Product/offer prices are revalidated against the quote source price before stock mutation.
- Target-currency unit prices are persisted on order items.
- Inventory reservations and marketplace fulfillment shipment routing are attached to the order.
- CARD/COD capability checks are enforced by the global commit path.
- Idempotency is scoped separately from the legacy EGP checkout path.

This is application/runtime integration evidence, not proof of live PostgreSQL, payment-provider, tax-authority, or carrier production certification.
