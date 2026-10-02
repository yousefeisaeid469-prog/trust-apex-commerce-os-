# TRUST V175 — Chief Decision Orchestrator

V175 adds a tenant-scoped arbitration layer above the V174 multi-agent fabric.

## Guarantees
- Cross-agent candidates are normalized and tenant-isolated.
- Candidate scoring combines priority, confidence, expected impact, risk, and matching signal strength.
- Tenant policy can bound risk, confidence, support, budget, and allowed/blocked actions.
- Unsafe or unsupported decisions fail closed with `NO_DECISION`.
- Risky, low-confidence, or agent-gated decisions become `APPROVAL_REQUIRED`.
- `simulateDecision` is non-mutating and deterministic.
- Decision identifiers and selected proposal IDs support idempotent persistence and audit trails.
