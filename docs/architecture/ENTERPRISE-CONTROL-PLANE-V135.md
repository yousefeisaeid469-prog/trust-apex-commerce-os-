# TRUST V135 — Enterprise Control Plane

The enterprise layer adds four bounded capabilities without weakening the transactional core:

1. **Tenant control** — durable tenant identity and lifecycle.
2. **Entitlements** — plan/contract capabilities with explicit denial semantics.
3. **Usage metering** — immutable, tenant-scoped, idempotent usage events.
4. **Billing state** — explicit finite-state transitions with no arbitrary jumps.

Operational metrics are persisted separately from business facts so observability cannot silently mutate commerce state.
