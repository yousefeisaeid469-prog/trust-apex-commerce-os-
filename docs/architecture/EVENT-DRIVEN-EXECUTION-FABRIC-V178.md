# TRUST V178 — Event-Driven Execution Fabric

V178 adds an event-driven backbone between decision, agent and execution layers.

## Guarantees
- Tenant + aggregate scoped sequence ordering.
- Event ID deduplication.
- Consumer delivery deduplication.
- Business-effect idempotency keys scoped by tenant.
- Bounded retries and dead-letter capture.
- Replay by predicate without changing the original event payload.
- Fail-closed validation for identity, ordering and payload size.

## Honest boundary
The in-memory implementation proves deterministic semantics and contracts. Production durability, broker delivery guarantees, database transactions and external exactly-once effects require integration tests against the real infrastructure.
