# TRUST V266 — Cryptographic Promotion Key Lifecycle

V266 closes the main governance gap left after V265: an Ed25519 public key is no longer merely active/revoked metadata. Keys have a durable lifecycle and every transition authorization carries freshness metadata.

## Key lifecycle

`ACTIVE -> RETIRED` during rotation, or `ACTIVE -> REVOKED` for emergency invalidation. Expiry is enforced at authorization time. `not_before` prevents future-dated keys from being used early. The lifecycle event table records actor, reason, predecessor and transition time.

Private signing keys are never persisted by TRUST and remain in an external secret/KMS boundary.

## Authorization freshness

Every transition authorization now binds:

- a cryptographic nonce;
- `signedAt`;
- `authorizationExpiresAt`;
- the existing decision/evidence/state/actor/key payload.

The durable transition path rejects future or expired authorization windows and checks the signing key lifecycle before signature verification. This supplements V265's payload-binding and actor/key-binding controls.

Auto-promotion remains disabled.
