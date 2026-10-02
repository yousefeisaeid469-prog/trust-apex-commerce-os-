# V311 — Global Logistics Network Optimization

V311 adds a network-level planning layer above V305 carrier intelligence and V310 promise enforcement. It allocates multiple shipments in one deterministic plan while respecting optional lane capacity overrides, promise urgency, cost, speed and reliability.

## Flow

V305 carrier intelligence → V308 control tower → V309 recovery → V310 promise enforcement → **V311 network optimization** → V306 execution.

## Runtime behavior

- Candidate carriers come from the existing V305/V304 registry boundary.
- Optional capacity records are supplied to the planner; absent capacity means no explicit capacity ceiling.
- Shipments are ordered by promise urgency, then shipment ID for deterministic planning.
- A plan is persisted with an idempotency key and allocation rows.
- An outbox event announces plan creation; applying carrier changes remains a separate execution concern.

## Boundary

No live DHL/FedEx/UPS capacity feed is claimed. V311 does not invent carrier capacity from external systems; capacity constraints are explicit planner inputs. Live carrier connectivity and live capacity-provider integration remain disabled.
