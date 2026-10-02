# TRUST V307.0.0 — Global Logistics Tracking Reconciliation

- Added migration 145 for durable global carrier tracking receipts.
- Added ordered/idempotent carrier event ingestion runtime.
- Added unmatched and stale event handling.
- Added carrier webhook and order tracking APIs.
- Added V307 tests and audit.

Validation boundary: live DHL/FedEx/UPS webhook connectivity and full PostgreSQL E2E are not certified in this environment.
