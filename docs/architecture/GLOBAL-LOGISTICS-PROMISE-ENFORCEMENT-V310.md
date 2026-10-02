# TRUST V310 — Global Logistics Promise Enforcement

V310 adds a delivery-promise control layer above V308 risk and V309 recovery.

Flow: shipment telemetry → control-tower risk → ETA/promise comparison → promise risk → durable enforcement action → outbox dispatch.

The runtime distinguishes ON_TRACK, AT_RISK, and BREACH and calculates minutes-to-promise, minutes-to-ETA, and slack. Enforcement is idempotent and never claims that an external carrier was contacted; carrier replans and escalations are durable outbox requests until an external worker/provider is connected.

Validation boundary: no live carrier connectivity, live external provider execution, or full PostgreSQL E2E certification is claimed in this environment.
