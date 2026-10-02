# Autonomous Commerce Orchestrator — V214

## Flow
`commerce event → Event-Driven Execution Fabric → V211 Commerce Brain → V212 Control Plane → V213 Runtime → Execution Adapter Mesh`

## Guarantees
- Events are appended and delivered through the existing fabric with strict ordering, bounded payloads, retries and effect idempotency.
- Brain signals retain freshness and source-event evidence.
- Control policy remains authoritative for risk, confidence and approval.
- Only `READY` intents can reach the execution adapter boundary.
- Provider success still requires an explicitly injected adapter result.

## Honest boundary
The orchestrator is event-driven inside a process. V214 does not claim durable cross-process orchestration or durable runtime command persistence. A production deployment should persist commands/jobs and leases before treating this layer as a horizontally scaled worker system.
