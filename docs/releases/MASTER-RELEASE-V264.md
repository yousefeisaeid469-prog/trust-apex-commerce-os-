# TRUST V264.0.0 — Durable Reality Promotion Ledger

## Major change

Added a PostgreSQL-backed, append-only promotion governance ledger between V263 evidence decisions and any future promotion.

## Delivered

- Migration 102: durable decision and event tables.
- State-machine enforcement for explicit promotion workflow.
- Evidence binding against attestation root and evidence leaf.
- Hash-chained transition events.
- V264 ledger artifact and regression test.
- Release-gate integration.

## Safety boundary

No capability is approved or promoted by V264 itself. The four existing V263 decisions remain pending explicit review.
