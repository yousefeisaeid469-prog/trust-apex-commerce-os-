# TRUST V265 — Cryptographic Reality Promotion Authorization

V265 adds cryptographic authorization to the durable promotion ledger. Every promotion state transition must carry an Ed25519 signature verified against an active public key bound to the actor. TRUST stores only public verification keys and signatures; private keys remain outside the repository in an external secret or KMS boundary.

## Authorization payload

The signature binds the decision id, decision hash, current state, target state, actor id, key id, rationale, attestation root, and evidence leaf. This prevents replaying a valid signature against a different transition or evidence set.

## Durable path

`signature -> public-key lookup -> actor/key binding -> payload verification -> authorization record -> append-only event -> state transition`

Auto-promotion remains disabled.
