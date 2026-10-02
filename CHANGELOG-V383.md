# V383.0.0 — Global Commerce Execution Fabric

V383 adds a durable orchestration boundary above the V382 execution mesh.

## Implemented
- Durable workflow and step state in PostgreSQL.
- Adapter registry with an explicit `commerce.recovery.v382` authority binding.
- Leased worker claims with bounded retries and dead-letter terminal state.
- End-to-end execution receipts and verification evidence.
- V383 worker delegates business execution to the existing V382 mesh and therefore does not become a second business-domain authority.
- API: `GET/POST /api/commerce/automation/execution-fabric`.
- Audit and contract test.

## Deliberate boundary
No external provider credentials or fake provider calls were introduced. The first adapter is an internal authority binding to the real V382 commerce execution mesh. Future provider adapters must be registered against concrete provider contracts before they are executable.
