# TRUST V306.0.0 — Global Logistics Execution

V306 turns V305 logistics intelligence into a durable execution boundary.

## Flow
1. V305 selects a carrier/service and persists decision evidence.
2. V306 creates an idempotent execution job tied to the exact decision and shipment.
3. The selected carrier/service is written onto a planned shipment.
4. A worker claims jobs with leases and bounded attempts.
5. `TRUST-E2E` uses a deterministic in-process sandbox label generator; other carriers remain adapter boundaries.
6. Successful execution writes tracking/provider references, shipment `LABEL_CREATED`, a tracking event, an attempt ledger row, and an outbox event in one transaction.
7. Failures remain durable, retryable, and terminal after six attempts.

## API
- `POST /api/fulfillment/global-carriers/execute` queues execution.
- `GET /api/fulfillment/global-carriers/execute?orderId=...` returns execution history.

## Reality boundary
No live DHL/FedEx/UPS connectivity is claimed. The deterministic sandbox is intended for local and CI proof of the execution contract without external credentials.
