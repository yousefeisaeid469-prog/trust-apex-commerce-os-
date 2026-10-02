# TRUST APEX OS — V327

## Commerce execution closure
V327 connects the previously separate payment-capture and delivery runtime pieces for standard marketplace orders.

### Operational path
`payment captured → fulfillment orders → shipments → delivery tracking → fulfillment delivered → order delivered → seller settlement released → execution completed`

### Persistence
- Migration `165_v327_commerce_execution_runtime.sql` adds `trust_commerce_execution_runs`.
- No audit-only evidence layer was added.

### Verification
- `tests/v327-commerce-execution.test.mjs` verifies the runtime wiring, persistence contract, locking and idempotency markers.
- Full PostgreSQL integration, external payment provider, and carrier execution require deployment infrastructure and credentials and are not claimed by this source-level release.
