# TRUST V141 — Verification & Chaos Engine

V141 turns reliability claims into deterministic, replayable verification campaigns. It covers state-machine fuzzing, webhook replay storms, lease/fencing failures, invariant enforcement, and recovery verification.

## Principle

The system is not considered verified because a happy-path test passes. A scenario must be reproducible from a seed, bounded by explicit limits, fail closed on invariant violations, and produce evidence suitable for release review.

## Boundaries
- Deterministic PRNG and campaign bounds
- State-machine transition verification
- Webhook duplicate/gap detection
- Lease fencing validation
- Recovery evidence verification
- PostgreSQL persistence for campaign/evidence/event records
