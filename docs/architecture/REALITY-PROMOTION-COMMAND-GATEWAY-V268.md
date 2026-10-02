# TRUST V268 — Reality Promotion Command Gateway

V268 moves the promotion ledger from a transition-only API to a durable command gateway.

## Runtime boundary

A promotion transition must carry a unique `commandId`. The command envelope contains the decision, actor, signing key, target command, evidence binding, nonce and authorization time window. TRUST deterministically hashes this envelope and persists it before applying the signed authorization.

## Idempotency

An already-applied command is a safe idempotent replay and returns its original event hash. Reusing a command ID with a different command hash is rejected. The command hash is also globally unique.

## Atomicity

The command record, cryptographic authorization, promotion event, governance event and decision-state update execute in the same PostgreSQL transaction. A failure rolls the whole operation back.

## Security

The command is bound into the signed authorization payload and into the promotion event. No private signing key is stored by TRUST. Auto-promotion remains disabled.
