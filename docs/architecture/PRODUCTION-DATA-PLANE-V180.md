# TRUST V180 — Production Data Plane

V180 makes the autonomous layer database-backed instead of process-local. Agent registry, autonomy decisions, fraud assessments and fabric telemetry are read/written through the PostgreSQL boundary.

## Guarantees
- Parameterized SQL only.
- Tenant UUID validation at persistence boundaries.
- Checkout runs inside an explicit PostgreSQL transaction with row locks and idempotency.
- Inventory has a database CHECK constraint preventing negative stock.
- Autonomous state has durable indexes for tenant/time queries.
- The UI/API does not claim production health when `DATABASE_URL` is absent.

## Not claimed
This does not prove a live production deployment, payment capture, carrier execution, browser E2E, or disaster recovery. Those require environment-backed integration tests.
