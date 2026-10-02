# TRUST V309 — Global Logistics Recovery Orchestrator

V309 turns V308 control-tower observations into durable recovery plans and actions.

## Flow

V304 carrier network → V305 logistics intelligence → V306 execution → V307 tracking reconciliation → V308 control tower → **V309 recovery orchestrator**.

## Guarantees

- Recovery planning is deterministic from the V308 assessment.
- Plans and actions have unique idempotency keys.
- Worker claims use row locking with `SKIP LOCKED` and a lease.
- Worker attempts are bounded by `max_attempts`.
- `RETRY_LOGISTICS_EXECUTION` creates a new V306 execution job using the latest logistics decision and a recovery-scoped idempotency key.
- Carrier refresh, customer-promise review, and critical escalation are emitted as durable outbox requests; they do not pretend that an external carrier or human operator has already acted.
- Terminal action failure marks the parent recovery plan failed.

## Boundary

V309 does not claim live DHL/FedEx/UPS connectivity, live carrier API execution, or full PostgreSQL E2E certification in the current development environment.
