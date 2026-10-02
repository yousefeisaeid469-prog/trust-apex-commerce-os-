# TRUST V256.0.0 — Reality Evidence Execution

V256 moves the reality pipeline from static evidence inspection to executable evidence verification for the existing eight structured claims.

- Added `scripts/reality_evidence_execution.mjs`.
- Each structured claim is checked for implementation artifacts, exact runtime markers, and isolated regression-test execution.
- Evidence-only execution is deliberately separated from promotion.
- Documentation-only capability drafts are excluded from auto-promotion.
- Migration 101 remains the latest canonical migration; no schema change was required.
- Release gate now validates the V256 execution report.
