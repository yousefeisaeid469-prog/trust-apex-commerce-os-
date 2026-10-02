# TRUST V138 — Distributed Systems Architecture

V138 establishes explicit primitives for correctness under concurrency and partial failure.

## Core invariants
- **Fencing:** every lease renewal/writer action is associated with a monotonically increasing fence token; stale workers are rejected.
- **Event integrity:** ordered domain events form a tamper-evident SHA-256 hash chain and can be deterministically replayed.
- **Command identity:** commands carry tenant, actor, correlation and version identity and produce a deterministic fingerprint for deduplication.
- **Saga compensation:** multi-step workflows compensate completed reversible steps in strict reverse order after failure.
- **Circuit resilience:** provider/service failures can trip an OPEN circuit and permit a controlled HALF_OPEN probe after cooldown.

## Production boundary
The TypeScript modules are deterministic reference implementations and testable policy primitives. PostgreSQL tables in migration 028 are the authoritative persistence boundary. Redis, Kafka, Temporal, OpenTelemetry or cloud-specific infrastructure can be attached through adapters without changing domain invariants.

## Why this matters
This moves TRUST beyond feature breadth into distributed-systems correctness: concurrency control, replayability, failure containment, and explicit recovery semantics are now first-class architecture concerns.
