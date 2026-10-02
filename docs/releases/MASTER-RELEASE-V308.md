# TRUST V308.0.0 — Global Logistics Control Tower

- Added migration 146 for durable logistics control-tower snapshots.
- Added deterministic shipment risk scoring across ETA, carrier-event freshness, execution failures, and fulfillment exceptions.
- Added order-level and fleet-level control-tower APIs.
- Added bounded operator recommendations: refresh carrier tracking, retry execution, review customer promise, or escalate critical exceptions.
- Added V308 tests and audit.

Validation boundary: live external carrier connectivity and full PostgreSQL E2E are not certified in this environment.
