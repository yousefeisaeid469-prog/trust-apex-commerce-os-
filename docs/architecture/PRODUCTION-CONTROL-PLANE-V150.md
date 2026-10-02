# TRUST V150 — Production Control Plane

V150 closes the control loop around deployment execution with durable PostgreSQL state, transactional leases/idempotency, reliability-gated promotion, rollback/recovery verification, telemetry boundaries, and deterministic evidence.

## Production boundary
The PostgreSQL store is a real `pg` implementation and the telemetry sink includes a real OTLP/HTTP exporter. Infrastructure remains adapter-driven: V149 Kubernetes and traffic adapters are reusable and must be configured with real cluster/provider credentials before affecting production.

## State machine
PREFLIGHT → DEPLOYING → SHIFTING_TRAFFIC → VERIFYING → PROMOTING → COMPLETE.
Any gate failure enters ROLLING_BACK → RECOVERY_VERIFY. Failed recovery is ESCALATED (fail closed).

## Durability
Deployment state, leases, idempotency records, and telemetry signals are persisted in migration 040. Lease acquisition and idempotency checks occur inside a transaction.

## Evidence
Each terminal result receives a deterministic SHA-256 evidence hash over the deployment intent, terminal record, and observed telemetry.
