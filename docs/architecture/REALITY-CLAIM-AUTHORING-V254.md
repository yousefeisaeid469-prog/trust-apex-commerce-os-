# TRUST V254 — Reality Claim Authoring

V254 adds an explicit authoring boundary between lexical/documentation discovery and evidence promotion.

## Why

V252 identified candidate artifacts for `DOCUMENTED_ONLY` records. V253 correctly refused to promote those candidates without explicit runtime and test evidence. V254 turns that queue into structured draft contracts so each record has a deterministic place for human/engineering authoring.

## Contract

A draft contains:

- source record ID and claim text;
- candidate implementation artifacts as **hints only**;
- an empty runtime-marker list;
- an empty regression-test list;
- an explicit `DRAFT_NEEDS_AUTHORING` status.

A draft cannot be `PROVEN` merely because an artifact matches textually. Runtime markers and regression tests must be attached explicitly before the V253 promotion gate can accept it.

## Verification

`npm run reality-claim-authoring` generates the JSON/Markdown queue. `tests/v254-reality-claim-authoring.test.mjs` asserts that all 96 documentation-only records remain drafts and that no runtime/test evidence is auto-invented.
