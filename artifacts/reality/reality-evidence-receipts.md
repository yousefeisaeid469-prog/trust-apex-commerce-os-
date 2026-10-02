# TRUST V261.0.0 — Evidence Receipts

An evidence receipt is valid only when every declared artifact exists and its SHA-256 digest is recorded, every exact runtime marker is present in a declared artifact, and every declared regression test command exits with code 0. Receipts never promote claims by themselves.

## Integrity contract
- Every artifact must exist and have a recorded SHA-256 digest.
- Every runtime marker must be found in the claim-declared artifact set.
- Every regression test must execute successfully in isolation.
- Receipts are evidence records; they never auto-promote a claim.

## Counts
- Receipts: 8
- Valid: 8
- Blocked: 0
- Promotion allowed: 0
