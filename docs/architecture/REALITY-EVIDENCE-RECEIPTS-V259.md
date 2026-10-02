# TRUST V259.0.0 — Reality Evidence Receipts

V259 adds an integrity-bound evidence receipt layer for the structured reality claims already admitted by the V248 ledger.

## Evidence chain

`structured claim → declared artifacts → SHA-256 digests → exact runtime markers → executable regression tests → immutable receipt record`

A receipt is **evidence**, not promotion. The promotion policy remains separate and conservative.

## Integrity guarantees

1. Every declared artifact must exist.
2. Every artifact gets a SHA-256 digest recorded in the receipt.
3. Every declared runtime marker must occur in the claim-declared artifact set.
4. Every declared regression test is executed in isolation and must exit with code `0`.
5. A receipt can never set `promotionAllowed=true`.
6. The release gate requires the complete receipt set to be valid.

## Scope

V259 covers the eight structured claims already present in `config/reality/release-claims-v248.json`. The 58 historical capability drafts remain outside this receipt set until explicit evidence contracts are authored for them.

## Runtime command

`npm run reality-evidence-receipts`

The aggregate report is written to `artifacts/reality/reality-evidence-receipts.json`, with one receipt per claim under `artifacts/reality/evidence-receipts/`.
