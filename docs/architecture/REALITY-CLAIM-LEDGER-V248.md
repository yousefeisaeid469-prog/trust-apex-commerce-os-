# Reality Claim Ledger — V248

The ledger at `config/reality/release-claims-v248.json` is an executable architecture contract.

It prevents a recurring failure mode where a release document describes a complete feature while only its database scaffolding or static definitions exist.

Each claim maps to:

`claim → implementation artifacts → runtime markers → regression tests`

`scripts/reality_claim_audit.mjs` evaluates the chain and fails closed when any link disappears.

This is intentionally source-level evidence. It does not assert that external production infrastructure, provider credentials, PostgreSQL clusters, network routing, or third-party services are provisioned.
