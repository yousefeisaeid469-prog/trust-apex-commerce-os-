# TRUST V350 — Payout Webhook + Reconciliation Hardening

## Production code shipped
- Added durable `trust_marketplace_payout_provider_events` inbox with unique `(provider, provider_event_id)` replay protection.
- Added payout webhook amount/currency/provider/reference validation before state transition.
- Added transactional provider-event processing: persist event, reconcile payout, apply payout state transition, mark processed, and emit an outbox event in one transaction.
- Added provider webhook endpoint: `POST /api/payments/payout/webhook`.
- Added provider-specific webhook secret lookup with `PAYMENT_<PROVIDER>_WEBHOOK_SECRET`, falling back to `PROVIDER_WEBHOOK_SECRET`.
- Added HMAC/timestamp verification using the existing provider webhook verifier.
- Added payout provider event ID persistence on payout requests for traceability.
- Added conflict detection for replayed provider event IDs carrying different payout/status/amount/currency data.

## Verification
- V348 payout protection regression: PASS
- V349 payout provider execution regression: PASS
- V350 payout webhook reconciliation regression: PASS
- Migration check: PASS — 182 canonical migrations, contiguous identity, checksum manifest compatible.
- Full live provider transfer was not claimed; that requires configured live provider credentials and a reachable provider endpoint.
