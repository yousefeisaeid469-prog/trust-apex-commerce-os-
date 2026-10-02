# Fulfillment + Tracking 3.0 — V201

The V201 boundary turns fulfillment tracking from demo-oriented logistics objects into durable database state tied to real orders.

## Domain
`trust_shipments` is the durable shipment aggregate. `trust_shipment_tracking_events` is its append-only operational history. Tracking event IDs are deterministic so repeated carrier events can be safely ignored.

## Provider boundary
Carrier behavior is represented by `CarrierAdapter`. V201 does not manufacture provider success or credentials. A production deployment must inject a real carrier implementation for label creation and tracking retrieval.

## Order lifecycle
Operational shipment states can advance `trust_orders` to `shipped` or `delivered`. Exceptions keep the order in `processing` while preserving an explicit shipment exception event.

## Customer boundary
`GET /api/customer/orders/:id/shipments` is authenticated and checks order ownership (or privileged operations roles). Responses are `no-store`.

## Operational boundary
`POST /api/shipments/:id/tracking` is restricted to admin/support/operations and writes durable events under a transaction lock. Carrier webhooks/reconciliation can call the same domain boundary through an adapter/worker in a future deployment integration.

## Honest production status
Database persistence and domain contracts are implemented. Live carrier connectivity, credentials, delivery webhooks, label purchasing, carrier SLA monitoring, and production E2E are not claimed until real adapters and infrastructure are connected.
