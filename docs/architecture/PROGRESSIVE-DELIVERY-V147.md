# TRUST V147 — Progressive Delivery & Global Rollout Orchestrator

V147 introduces a staged rollout state machine above V146 Deployment Autopilot. The orchestrator evaluates reliability telemetry at each exposure level and refuses to advance when the gate blocks.

## Stages
The default sequence is **1%, 5%, 25%, 50%, 100%**. Every stage declares an ordinal, exposure percentage, regions, and observation window. A configured `maxBlastRadiusPct` is enforced before a stage can start.

## Control flow
`PREFLIGHT → CANARY/OBSERVE → PROMOTE → next stage → COMPLETE`

On a blocked stage: `OBSERVE → HALT → [ROLLBACK → VERIFY] → COMPLETE | HALT`.

If rollback verification fails, the control plane remains fail-closed rather than resuming rollout.

## Evidence
The result records stage gates, transitions, completion percentage, runtime verification, and a deterministic SHA-256 evidence hash. The reference adapter is deliberately in-memory; live cloud control requires provider integration and independent verification.
