# TRUST V321 — REAL MONETIZATION WIRING

V321 is an additive implementation release. Existing V319/V320 capabilities are retained.

## What became real
- The existing captured-payment settlement path now writes durable platform revenue entries.
- Seller referral/marketplace commission is recorded as `COMMISSION` revenue.
- Payment-related seller fees are recorded as `PAYMENT_FEES` revenue when a fee rule exists.
- Fulfillment fees are recorded as `FULFILLMENT` revenue when a fee rule exists.
- Refund settlement reversals now create proportional revenue-ledger `REFUND` entries for commission, payment fees, and fulfillment fees.
- A default marketplace referral rule of 20% (2000 bps) is installed only when no active global referral rule already exists. Merchant/category-specific rules continue to take precedence.
- Revenue entries are idempotent and tied to the existing payment/refund transaction paths.

## Important architecture choice
V321 does not create another audit/evidence layer. It connects the already-existing economic settlement engine to the V320 revenue ledger so revenue is produced by actual commerce events rather than by a separate reporting claim.

## Migration
- `db/migrations/159_v321_monetization_wiring.sql`

## Verification performed
- `tests/v319-real-capabilities.test.mjs` — PASS
- `tests/v320-monetization-source.test.mjs` — PASS
- `tests/v321-monetization-wiring.test.mjs` — PASS

## Reality boundary
This archive does not contain production payment-provider credentials or a live PostgreSQL environment, so external-provider connectivity and live end-to-end settlement cannot honestly be marked proven here. The database-backed implementation and source-level wiring are present.
