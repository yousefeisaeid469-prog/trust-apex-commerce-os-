# TRUST V253 — Reality Evidence Promotion Engine

V253 adds a strict promotion layer on top of the V252 Reality Evidence Graph. The engine does not infer production truth from lexical similarity. It evaluates explicit structured claims against three gates: implementation artifacts, runtime evidence markers, and regression tests.

## Promotion rule

A claim is `READY_FOR_PROMOTION` only when every declared artifact exists, every declared marker is present in a declared artifact, and every declared regression test exists. Otherwise it remains `BLOCKED`.

Documentation-only records from the full-system audit are retained in a queue with `BLOCKED_NO_STRUCTURED_CLAIM`. They must first be authored as explicit contracts before executable evidence can be evaluated.

## Safety

- No database migration is introduced.
- No claim is promoted from documentation alone.
- Candidate mappings from V252 are never treated as proof.
- The engine reports missing evidence instead of fabricating it.
