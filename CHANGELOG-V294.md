# TRUST V294 — Production E2E Evidence

V294 adds an executable production-like end-to-end evidence runner and durable run/step evidence.

## Real flow exercised when dependencies are configured
- Real PostgreSQL through DATABASE_URL.
- Real buyer registration/session.
- Real seller registration/store.
- Real product and stock.
- Real cart and server-authoritative quote.
- Real order commit with idempotency.
- Real payment intent against the configured sandbox provider.
- Real signed webhook HTTP call and duplicate replay.
- Real shipment creation and delivery tracking against the database.
- Delivery-triggered seller balance release.
- Real payout request and paid transition.
- Real seller balance reconciliation with zero mismatches required.

## Evidence boundary
This release provides the executable path and durable evidence model. It does not claim that the flow has been run against a live PostgreSQL/provider in this build environment when those dependencies are unavailable. `scripts/production_e2e.mjs` fails closed when required production-like dependencies are missing.
