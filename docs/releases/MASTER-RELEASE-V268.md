# TRUST V268.0.0 — Cryptographic Promotion Command Gateway

## Delivered

- Added migration 106 with a durable promotion command table and command-hash uniqueness.
- Added a typed V268 command envelope and deterministic SHA-256 command hashing.
- Bound command identity to cryptographic authorization payloads and promotion events.
- Added idempotent replay for already-applied commands.
- Rejects command-ID reuse when the command payload changes.
- Keeps the promotion state mutation, authorization, event, governance event and command receipt in one transaction.
- Auto-promotion remains disabled and private signing keys remain external/KMS-only.

## Verification

The V268 command gateway harness verifies deterministic command identity, tamper rejection, command-to-authorization/event binding, idempotency semantics and the no-private-key/no-auto-promotion boundary.
