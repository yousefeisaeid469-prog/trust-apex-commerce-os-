# TRUST V264 — Durable Reality Promotion Ledger

V264 turns the V263 promotion-control decision set into a durable governance boundary.

## Runtime contract

`pending decision -> explicit actor transition -> evidence binding check -> append-only event -> durable current state`

The ledger stores current decision state in PostgreSQL and records every transition in an append-only event table. Each event is hash-linked to the previous event for the same decision.

V264 does not approve or promote any capability automatically. The four V263 decisions remain `PENDING_EXPLICIT_REVIEW` until an authorized actor explicitly transitions them.

## Safety invariants

- Auto-promotion is disabled.
- A transition must be allowed by the state machine.
- The attestation root and evidence leaf must match the current decision.
- An actor and rationale are mandatory.
- Every transition creates an immutable event record with a hash-chain link.
- Migration 102 is the first schema change after V250; migrations 001-101 remain immutable.
