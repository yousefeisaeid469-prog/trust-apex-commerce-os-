# TRUST V257 — Reality Capability Contract Compiler

V257 turns the 58 capability records identified by the reality resolver into explicit, machine-readable contract shells.

## Why

V256 proved that the existing eight structured claims can execute an evidence chain. The remaining capability queue must not be promoted by lexical similarity or documentation proximity. V257 creates the contract boundary required to author those capabilities safely.

## Contract shape

Each capability contract contains:

- stable contract ID;
- source record ID;
- capability claim text;
- lifecycle state (`DRAFT`);
- domain ownership hint (non-authoritative);
- explicit evidence fields for implementation artifacts, runtime markers, and regression tests;
- an explicit failure condition;
- discovery hints kept separate from authoritative evidence.

## Promotion rule

Candidate artifacts and lexical markers are discovery hints only. The compiler intentionally leaves authoritative evidence arrays empty. A capability remains blocked until an explicit author supplies concrete implementation, runtime, and regression evidence.

## V257 verification

- 58 capability records compiled.
- 58 unique contract IDs.
- 0 contracts ready for execution.
- 0 inferred evidence entries.
- 0 auto-promotions.
- Migration 101 remains the latest canonical migration; no schema change is required for this release.
