# TRUST APEX OS V186 — Provider Reconciliation & Automatic Recovery

V186 hardens the Purchase Guardian production boundary with a durable provider webhook inbox, signed webhook verification, idempotent reconciliation, and automatic recovery of expired execution leases.

## Delivered
- HMAC-SHA256 webhook verification at the provider boundary.
- Durable `trust_provider_webhook_events` inbox with `(provider,event_id)` uniqueness.
- Reconciliation of provider outcomes back into Purchase Guardian action state.
- Durable outbox event after reconciliation.
- Expired `EXECUTING` Guardian actions can be safely returned to `APPROVED` for retry.
- Customer/provider references remain isolated by existing authorization boundaries.

## Verification
Run `npm test`, `npm run migration-check`, `npm run contract-check`, and `npm run release-gate` in an installed dependency environment.

## Production boundary
Provider credentials, real PSP/carrier webhook signing secrets, public webhook delivery, TLS, observability, rate limiting/WAF, replay-window policy, and live provider certification are still required before claiming live production operation.
