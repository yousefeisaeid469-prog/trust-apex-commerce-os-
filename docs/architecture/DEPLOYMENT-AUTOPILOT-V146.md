# TRUST V146 — Deployment Autopilot

V146 turns the V145 production-reliability boundary into a deterministic deployment state machine.

## Control loop
1. Preflight validates the release candidate.
2. Canary starts through an explicit deployment adapter.
3. Reliability telemetry is evaluated against the V143 policy.
4. A passing canary is promoted automatically.
5. A blocked canary is frozen and may enter a recovery verification window.
6. If recovery fails, the autopilot rolls back and verifies the rollback before resuming.
7. Failed rollback verification remains frozen and escalates.
8. Every terminal path emits deterministic evidence.

## Production boundary
The reference implementation is deliberately adapter-based. `InMemoryDeploymentAdapter` is a verification adapter, not a claim of live Kubernetes, AWS, GCP, Azure, GitHub, or Argo control. A production adapter must implement the same contract and provide authenticated deployment APIs, idempotency, concurrency control, audit logging, and independent runtime verification.

## Fail-closed semantics
Promotion requires a passing gate and verified runtime state. Rollback requires post-rollback verification. Any adapter failure or verification mismatch prevents autonomous promotion and leaves the rollout frozen where possible.
