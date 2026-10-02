# TRUST V320 — REAL COMMERCE MONETIZATION

V320 is additive. Existing features are retained.

## New durable capabilities
- Revenue ledger for commission, ads, subscriptions and related surfaces.
- Sponsored Product / Sponsored Brand / Display campaign persistence.
- Metered ad events with idempotent charging.
- Seller subscription plans with durable billing periods.
- Marketplace commission posting into the revenue ledger and merchant finance transactions.
- Merchant revenue summary API.

## Reality boundary
The code is production-oriented and database-backed, but external payment/ad/shipping credentials and provider webhooks still require real deployment configuration. `surfaceStatus: LIVE` means the implementation is database-backed; it does not claim that an external provider is connected.

## Migration
`db/migrations/158_v320_commerce_monetization.sql` is additive and must be applied through the existing migration runner.

## Verification performed in this environment
- Migration numbering is contiguous through 158.
- `tests/v320-monetization-source.test.mjs` passes.
- Existing V319 real-capability test was previously observed passing in the supplied release.
- Full integration/E2E against PostgreSQL was not executed here because the archive has no installed dependencies or live database credentials.
