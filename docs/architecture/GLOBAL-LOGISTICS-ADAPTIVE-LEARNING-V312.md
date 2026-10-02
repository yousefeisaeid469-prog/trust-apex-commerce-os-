# TRUST V312 — Global Logistics Adaptive Learning

V312 turns reconciled logistics outcomes into bounded, auditable carrier/service performance profiles.

## Flow

`V307 reconciled tracking -> completed shipment outcomes -> learning observations -> confidence-shrunk profiles -> V311 adaptive ranking`

## Model

Profiles track delivery rate, promise-hit rate, exception rate, average realized transit days and confidence. Small samples are shrunk toward conservative priors rather than allowed to dominate carrier selection.

The adaptive reliability score blends posterior delivery, promise performance and exception avoidance. It is deterministic and bounded to `[0,1]`.

## Persistence

- `trust_global_logistics_learning_runs`
- `trust_global_logistics_learning_observations`
- `trust_global_logistics_carrier_learning`

## APIs

- `GET/POST /api/fulfillment/global-carriers/learning`
- `POST /api/fulfillment/global-carriers/adaptive-optimization`

The adaptive optimization endpoint is preview-only: it changes the ranking input but does not claim to mutate external carrier systems.

## Evidence boundary

V312 learns only from data already present in TRUST's reconciled tracking ledger. No external carrier feed is bundled or certified. Full project typecheck and live PostgreSQL/provider E2E remain environment-dependent.
