# Global Carrier Network — V304

V304 adds a carrier network control plane between global checkout/order fulfillment and provider adapters.

## Runtime
- Carrier registry and service matrix.
- Country + currency + service-mode capability filtering.
- Deterministic route ranking with preference and avoidance support.
- Durable route selection and idempotency.
- Carrier health counters with a five-consecutive-failure circuit-open threshold.
- Explicit shipment failover records.
- Existing provider adapters remain responsible for external HTTP/provider execution.

## Boundary
DHL/FedEx/UPS descriptors are registry entries only. No live credentials or external connectivity are claimed by this release.
