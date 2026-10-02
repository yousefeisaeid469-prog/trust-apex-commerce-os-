# TRUST V257.0.0 — Reality Capability Contract Compiler

V257 establishes an explicit contract boundary for the 58 capability claims that remained unresolved after the V256 executable-evidence pass.

- Added `scripts/reality_claim_contract_compiler.mjs`.
- Added machine-readable capability contract shells under `artifacts/reality/`.
- Added a regression test proving no evidence is inferred or auto-authored.
- Kept candidate discovery hints separate from authoritative evidence fields.
- No database migration was added; migration 101 remains canonical.
