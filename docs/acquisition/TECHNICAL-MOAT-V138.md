# TRUST V138 — Technical Moat

V138's moat is not file count. It is the set of enforceable invariants spanning tenant isolation, transactional commerce, governance and distributed execution.

1. Fencing tokens prevent stale workers from committing after lease loss.
2. Hash-chained event logs provide tamper evidence and deterministic replay primitives.
3. Command fingerprints establish a stable identity for idempotent distributed command handling.
4. Saga orchestration makes compensation explicit rather than implicit in application code.
5. Circuit breakers contain repeated provider failures and create a controlled recovery path.
6. PostgreSQL migration 028 makes the persistence model explicit for leases, event history, command dedupe, saga state and circuit state.

A buyer should distinguish these tested primitives from production infrastructure integrations; real-world scale evidence still requires deployed load, failure injection, restore drills and provider telemetry.
