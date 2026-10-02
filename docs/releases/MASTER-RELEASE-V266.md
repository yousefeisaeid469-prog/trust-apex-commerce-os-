# TRUST V266.0.0 — Cryptographic Promotion Key Lifecycle

V266 hardens V265's cryptographic promotion authorization with durable key lifecycle governance and authorization freshness controls.

## Delivered

- Migration 104 adds key lifecycle state, validity windows, rotation lineage and append-only lifecycle events.
- Key registration supports explicit actor/reason metadata and retires the superseded active key.
- Key revocation is durable and auditable.
- Transition authorization requires nonce, signed timestamp and expiration timestamp.
- Transition execution rejects inactive, not-yet-valid, expired, future-dated and stale authorization windows.
- Private signing keys remain external/KMS-only.
- Auto-promotion remains disabled.

## Verification

V266 includes an Ed25519 lifecycle harness and a focused regression test covering schema markers, lifecycle APIs, freshness fields, signature validity, tamper rejection and the no-private-key/no-auto-promotion policy.
