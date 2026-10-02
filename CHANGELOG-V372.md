# TRUST V372 — End-to-End Commerce Reliability Fabric

V372 adds a durable, evidence-backed reliability graph across the existing commerce authorities: events → order → payment → inventory → fulfillment → delivery → settlement → revenue, plus execution jobs.

## Runtime
- `modules/platform/durable-events/reliability-fabric.ts`
- `GET /api/health/commerce/reliability/[orderId]`

## Persistence
- `trust_commerce_reliability_traces`
- `trust_commerce_reliability_trace_nodes`
- `trust_commerce_reliability_trace_edges`

The fabric is an evidence index, not a replacement source of truth. It reads authoritative records, materializes their relationships, classifies deterministic root causes, and exposes downstream impact.

## Verification boundary
Source/runtime smoke tests verify the implementation and migration structure. No live PostgreSQL/provider execution is claimed without a configured production-like database.
