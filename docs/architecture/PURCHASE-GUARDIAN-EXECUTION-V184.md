# Purchase Guardian Execution — V184

Approved Purchase Guardian actions now have a durable execution bridge into the Execution Adapter Mesh. External side effects remain adapter-owned and are never simulated by the core domain.

## Safety boundaries

1. Customer ownership is checked before execution.
2. Only `APPROVED` actions can execute.
3. Action identity produces a deterministic idempotency key.
4. Provider/network calls happen through an injected authorized adapter.
5. Execution outcomes and provider references are persisted.
6. Missing external infrastructure produces an explicit failure rather than a fake success.
