# TRUST V233 — Fulfillment Provider Execution & Reconciliation

V233 closes the provider boundary for fulfillment without inventing a carrier connection.

## Execution path

1. Operations plans a shipment in PostgreSQL.
2. `POST /api/shipments/:id/label` resolves a configured carrier adapter.
3. The adapter performs a real HTTP request when provider endpoint and secret are configured. Otherwise the operation fails closed with `PROVIDER_REQUIRED`.
4. The shipment stores `tracking_number` and `provider_reference` transactionally and emits an outbox event.
5. Carrier webhooks arrive at `/api/fulfillment/providers/webhook` with provider/event headers and an HMAC signature.
6. The webhook is written to the durable webhook inbox before a shipment provider event and reconciliation job are queued.
7. The reconciliation worker claims jobs with `FOR UPDATE SKIP LOCKED`, leases them, applies the normalized tracking event through the existing shipment state machine, and records completion.
8. Failed jobs retry with bounded attempts and a delayed next execution; five failed attempts become terminal `FAILED`.

## Provider contract

`FulfillmentProviderAdapter` is intentionally normalized around label creation, tracking, label cancellation, and webhook parsing. Provider-specific credentials and endpoints are environment configuration, not source-controlled demo values.

Environment keys are derived from the provider name:

- `FULFILLMENT_<PROVIDER>_BASE_URL`
- `FULFILLMENT_<PROVIDER>_SECRET`
- `FULFILLMENT_<PROVIDER>_WEBHOOK_SECRET`
- `TRUST_ENVIRONMENT=live` for LIVE posture; otherwise SANDBOX

The generic HTTP adapter expects a provider API that follows the normalized TRUST contract. A deployment must certify a real provider adapter before production use.

## Durable tables

Migration `083_v233_fulfillment_provider_execution.sql` adds:

- `trust_shipments.provider_reference`
- `trust_shipment_provider_events`
- `trust_shipment_reconciliation_jobs`

The existing `trust_webhook_inbox` remains the first durable ingestion boundary.

## Control tower

`/fulfillment-control-tower` exposes database-backed counts for active shipments, late shipments, exceptions, provider coverage, and reconciliation backlog. It is restricted to operations roles.

## Operations risk layer

V233 also computes deterministic fulfillment risk from shipment status, ETA, exception history and shipment age. Operations can acknowledge, escalate or resolve a recorded exception. Resolution resumes an exception shipment to `IN_TRANSIT` only through a durable transaction and emits an outbox event. No machine-learning claim is made by this layer.
