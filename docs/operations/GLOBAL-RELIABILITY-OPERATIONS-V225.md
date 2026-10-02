# V225 Operations Runbook

1. Define RTO/RPO per critical service.
2. Register backup evidence only after an actual backup exists.
3. Mark `VERIFIED` only after integrity/restore evidence is available.
4. During regional degradation, inspect the generated failover plan and require the appropriate human approval before traffic evacuation.
5. Run scheduled recovery drills and persist their results.
6. Treat missing/stale restore evidence as a blocker for disaster-recovery readiness.
7. Measure actual RTO/RPO during drills; do not infer them from configuration alone.

Production failover remains provider/orchestrator dependent. This module supplies the control-plane contract, evidence model, and decision boundary.
