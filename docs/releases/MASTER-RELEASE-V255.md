# TRUST V255.0.0 — Reality Claim Resolution

V255 adds a semantic resolution layer to the reality-evidence pipeline.

## Delivered

- Added `scripts/reality_claim_resolver.mjs`.
- Separated capability claims from limitations, release titles, and verification narrative.
- Generated machine-readable and Markdown resolution reports under `artifacts/reality/`.
- Added regression coverage for the classification boundary.
- Added release-gate coverage through the V255 resolver test.
- Preserved the rule that lexical candidates are never proof and never auto-promoted.
- No database migration was required; migration 101 remains the latest schema migration.

## Current evidence state

The resolver classifies 96 V254 documentation records as:

- 58 capability records requiring explicit evidence authoring;
- 24 limitation/non-claim records;
- 13 release-title records;
- 1 verification-narrative record.

This is a classification improvement, not a claim that the 58 capabilities are already proven.
