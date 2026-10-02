# TRUST V309.0.0 — Global Logistics Recovery Orchestrator

- Added migration 147 for durable recovery plans and action queues.
- Added deterministic recovery planning from V308 risk assessments.
- Added idempotent recovery actions with leases and bounded retries.
- Added real delegation for failed logistics execution back into the V306 execution queue.
- Added durable outbox dispatch for carrier refresh requests, customer-promise reviews, and critical escalations.
- Added recovery preview, plan, status, and worker APIs.
- Added V309 tests and audit.

Validation boundary: live external carrier connectivity, live carrier API execution, and full PostgreSQL E2E are not certified in this environment.
