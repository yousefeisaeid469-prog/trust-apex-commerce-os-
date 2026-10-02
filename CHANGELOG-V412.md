# V412.0.0 — Global Execution Idempotency Mesh

- Durable `trust_execution_claims` with operation scope, fingerprint, lease, owner and fencing token.
- Durable execution claim event audit trail.
- Command worker now claims execution authority before handler execution and replays successful results instead of re-running.
- Commerce execution now uses stable per-job idempotency keys and the V412 claim authority inside the business transaction.
- Stale claim takeover increments the fencing token; stale owners cannot complete a fenced claim.
- Fingerprint mismatch is rejected.
- Recovery remains connected through commerce execution jobs.

Migration 237 SHA-256: `d7458c4b6397069b78a1a567374fc1f789a97a79805f7b15a5cfb3d5864ab939`
