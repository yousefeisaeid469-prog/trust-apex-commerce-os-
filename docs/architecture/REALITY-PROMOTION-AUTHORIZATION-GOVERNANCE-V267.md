# TRUST V267 — Cryptographic Promotion Authorization Governance

V267 turns V265/V266 cryptographic authorization into a governed authorization boundary. The durable promotion transition now evaluates a versioned policy before consuming an authorization.

## Policy enforcement

- Authorization TTL is capped at 600 seconds by the durable policy.
- A fresh nonce is required and is globally unique, closing cross-decision replay.
- `APPROVED -> PROMOTED` requires separation of duties: the promotion actor cannot be the recorded reviewer.
- Auto-promotion is explicitly forbidden by policy.
- Authorization records carry the policy version used for the decision.

## Auditability

Accepted authorizations create durable governance events linked to the authorization record. Governance events use a previous-event hash to create an append-only audit chain.

Key expiry remains enforced by V266 lifecycle checks; V267 also provides a durable expiry sweep hook.

Private signing material remains external/KMS-only.
