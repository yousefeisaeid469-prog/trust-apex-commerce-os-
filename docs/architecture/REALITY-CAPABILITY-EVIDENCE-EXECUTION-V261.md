# TRUST V261 — Reality Capability Evidence Execution

V261 is the first release that executes an explicitly authored batch of capability evidence rather than only discovering or templating evidence.

## Pipeline

`Capability Claim → Explicit Evidence Contract → Source-Pinned Artifacts → Exact Runtime Markers → Executable Regression Test → Evidence Digest → Separate Promotion Review`

## Executed batch

Four historical capability claims are explicitly authored in `config/reality/capability-evidence-v261.json`:

1. Approval gates and idempotent execution receipts.
2. Canonical DB-backed checkout idempotency boundary.
3. Durable provider webhook reconciliation job creation.
4. Reduced-motion accessibility support.

The executor verifies that each declared implementation artifact exists, every exact runtime marker occurs inside those artifacts, and every declared regression test exits successfully.

## Safety boundary

Execution evidence is not the same as product-wide production certification. The executor does not auto-promote any capability. A separate review must decide whether the executed evidence is sufficient for the claim's intended scope.

Discovery candidates from earlier releases are not authoritative evidence.

## Schema

No database migration was added in V261. The canonical migration count remains 101.
