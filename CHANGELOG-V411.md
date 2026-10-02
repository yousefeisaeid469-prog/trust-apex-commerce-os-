# V411 — Global Worker Scheduling & Recovery Mesh

- Version: 411.0.0
- Migration: 236 (`e02d8405a11aeaee82a99d59759791c6b57c1481a68acbcc3111d05f4b3a0b07`)
- Unified queue admission and backpressure for command, workflow, commerce-execution and recovery workers.
- Durable worker slots with lease tokens and stale-slot reclamation.
- Priority-aware queue policy and scheduling snapshot.
- Recovery scheduler dispatches eligible V409 recovery cases into idempotent `RECOVER_ORDER` execution jobs.
- Command/workflow/commerce workers acquire and release queue slots.
- Added `/api/runtime/scheduling`.
- Added `recovery-scheduler-worker`.
- Static tests/audit/release gate added.

Validation intentionally does not claim full TypeScript/build or live PostgreSQL without dependencies/database.
