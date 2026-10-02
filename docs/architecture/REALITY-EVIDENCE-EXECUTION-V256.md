# TRUST V256.0.0 — Reality Evidence Execution

V256 adds an executable evidence harness for the eight structured claims already present in the V248 reality ledger.

## Contract

A claim is considered **EVIDENCE_EXECUTED** only when:

1. Every declared implementation artifact exists.
2. Every declared runtime marker is found in the declared artifact set.
3. Every declared regression test executes successfully in isolation.

The harness never promotes documentation-only records and never treats lexical discovery as proof. Promotion remains a separate policy decision.

## Result

The V256 execution report must show 8/8 structured claims executed, 0 blocked, and 0 auto-promoted.

No database migration is required; migration 101 remains the latest canonical schema migration.
