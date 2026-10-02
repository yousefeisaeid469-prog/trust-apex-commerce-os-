# V299 — Global Payment Runtime

- Added durable global payment attempts bound to order country, currency, method and provider.
- Added capability enforcement against the V297 global payment registry.
- Added authenticated global payment-intent API with idempotency.
- Bound payment records back to global payment attempts and propagate webhook status.
- Kept external payment providers behind the existing HTTP adapter boundary; no live provider is bundled.
