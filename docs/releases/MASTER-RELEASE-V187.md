# TRUST APEX OS — V187 Reconciliation Worker

V187 hardens provider reconciliation by making webhook processing queue-driven and recoverable.

- Signed webhooks require a timestamp and five-minute replay window.
- Webhook receipt persists a durable reconciliation job.
- A worker claims jobs with PostgreSQL `FOR UPDATE SKIP LOCKED` leases.
- Failed reconciliation retries up to five attempts before entering FAILED state.
- Expired Purchase Guardian execution leases are recovered by the same worker entry point.
- Duplicate provider events remain idempotent through the database unique key.

## Verification

This release is validated by deterministic repository tests, migration checks, contract checks, and the release gate. No live PSP/carrier credentials or production database were available in this environment, so V187 does not claim live provider certification.
