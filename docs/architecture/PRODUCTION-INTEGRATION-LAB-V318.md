# TRUST V318 — Production Integration Lab

V318 adds a concrete verification lab around the transactional marketplace path instead of another audit-only layer.

## Runtime checks
- transaction rollback semantics for injected payment failures
- idempotent replay of the same command
- inventory exhaustion behavior
- concurrent reservation probe with serialized critical section
- durable evidence schema for integration runs and checks
- optional PostgreSQL probe when `DATABASE_URL` is configured

## Truth boundary
The default lab is deterministic and self-contained. `liveDatabase=false` unless a real PostgreSQL connection is configured and the live probe succeeds. External payment/carrier providers remain `false`; the project does not claim live certification from a sandbox.

## Operational use
Run `npm run v318-integration-lab`. Run `npm run v318-postgres-lab` only with a valid PostgreSQL environment after migrations are applied.
