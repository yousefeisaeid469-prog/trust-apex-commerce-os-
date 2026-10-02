# TRUST V250 — Durable Autonomous Commerce Orchestrator

## Problem

The V214 orchestrator used an in-memory event fabric and an in-memory result map. That was useful for deterministic execution, but it was explicitly not durable across processes. A production-facing API surface existed, so this was a reality gap worth closing.

## Architecture

```
POST /api/autonomous-commerce-orchestrator
        │
        ├── PostgreSQL transaction
        │     ├── trust_commerce_events
        │     └── trust_autonomous_orchestration_runs
        │
        └── durable event delivery
                  │
                  ▼
      commerce_consumer_mesh worker
                  │
                  ▼
      autonomous-commerce-orchestrator consumer
                  │
                  ▼
       Brain → Control Plane → Runtime
                  │
                  ▼
      durable orchestration result
```

The durable API rejects function-valued runtime adapters because functions cannot be safely persisted. Real provider adapters remain a deployment/runtime concern.

## Guarantees

- Acceptance survives process restart once PostgreSQL commits.
- Duplicate event submission is idempotent at the durable event layer.
- Consumer delivery uses the existing `FOR UPDATE SKIP LOCKED` lease/retry/dead-letter machinery.
- Results are persisted and can be queried by tenant + run ID.
- Provider success is never fabricated.

## Verification boundary

Static audits and regression tests verify the implementation wiring. They do not replace live deployment, concurrency, disaster recovery, penetration testing, or provider certification.
