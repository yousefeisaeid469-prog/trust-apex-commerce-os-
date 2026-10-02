# TRUST V142 — Executable Reliability Laboratory

V142 upgrades the V141 verification primitives into an executable, deterministic reliability laboratory. The laboratory generates workloads, injects bounded faults, executes real in-process state transitions, shrinks failures, persists evidence, replays cases, records a failure corpus, and computes measurable SLO impact.

## Boundary
Faults are injected into the TRUST reliability execution boundary, not into a live production environment. Production fault injection still requires an explicitly authorized deployment adapter.

## Pipeline
Generated workload → fault injection → state transition → invariant/failure detection → shrinking → persisted receipt → replay → failure corpus → SLO evidence.

## Safety
Cases are bounded to 200 operations per campaign. Deterministic seeds make failures reproducible. No module claims live-production evidence unless a real deployment adapter supplies it.
