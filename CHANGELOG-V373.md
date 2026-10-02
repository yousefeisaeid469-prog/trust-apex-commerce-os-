# TRUST V373 — Verified Order Recovery Fabric

V373 connects the V372 evidence graph directly to a bounded, order-scoped recovery authority.

## Runtime
- `modules/platform/durable-events/reliability-recovery.ts`
- `POST /api/commerce/reliability/[orderId]/recover`
- `GET /api/commerce/reliability/[orderId]/recover`

## Recovery boundary
- Reclaims only stale consumer delivery leases whose event is tied to the requested order.
- Reclaims only stale commerce execution leases for the requested order.
- Re-observes the V372 reliability fabric after each recovery attempt.
- Persists before/after state, root cause, actions and verification result.
- Does not directly mutate payment, inventory stock, settlement, revenue or order state.

## Persistence
- `trust_commerce_reliability_recovery_runs`

## Verification boundary
The release gate verifies migration integrity, version alignment, local imports, V371/V372 behavior and V373 bounded recovery smoke tests. Live PostgreSQL/provider execution is only claimed when a configured environment actually exercises it.
