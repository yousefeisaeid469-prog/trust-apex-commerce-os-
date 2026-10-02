# TRUST V302 — Global Fulfillment Execution

V302 closes the delivery half of the global order lifecycle. Shipment delivery is reconciled into the durable fulfillment network, split shipments use an aggregate delivery gate, and seller settlement release is attempted only after every fulfillment order attached to the global orchestration is delivered.

## Runtime flow

`Shipment DELIVERED → fulfillment DELIVERED → aggregate delivery gate → Order DELIVERED → settlement release → Global Order COMPLETED`

The execution run is idempotent and records WAITING/COMPLETED/BLOCKED evidence. An unbound fulfillment order cannot be silently excluded because the aggregate count is calculated across all fulfillment orders, while shipment delivery is only promoted when its linked shipment is actually DELIVERED.

## Boundaries

Carrier APIs, real provider credentials, and live PostgreSQL/load certification remain environment-dependent. V302 does not claim external carrier connectivity.
