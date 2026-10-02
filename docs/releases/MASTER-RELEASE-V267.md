# TRUST V267.0.0 — Cryptographic Promotion Authorization Governance

V267 is a substantial governance layer on top of the V265 cryptographic authorization and V266 key lifecycle foundations.

## Delivered

- Migration 105 adds a durable governance policy and authorization policy-version binding.
- Authorization nonces become globally unique, preventing cross-decision replay.
- Authorization TTL is bounded by a durable 600-second policy.
- `APPROVED -> PROMOTED` enforces separation of duties between reviewer and promoter.
- Accepted authorizations are recorded in an append-only governance event chain.
- Durable key expiry sweep support is added.
- Auto-promotion remains forbidden.
- Private signing keys remain outside TRUST.

## Verification

The V267 governance harness verifies Ed25519 signatures, tamper rejection, fresh nonce presence, TTL enforcement policy, separation-of-duties wiring, governance audit markers, and the no-private-key/no-auto-promotion boundary.
