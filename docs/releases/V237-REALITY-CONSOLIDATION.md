# TRUST V237 — Reality Consolidation Patch

This patch hardens V237 around one rule: **production state must be durable and truthful**.

## Implemented

- Removed the runtime implementation of the old in-memory commerce order/catalog path; legacy entry points now fail closed with an explicit migration error.
- Rebuilt checkout quotes as durable PostgreSQL state with expiration and consumption tracking.
- Kept checkout commit authoritative on server-side product prices and shipping calculation.
- Moved merchant order reads to PostgreSQL and reconstructs order lines from durable order items.
- Moved merchant inventory updates to PostgreSQL transactions with row locking, ownership checks, and inventory ledger entries.
- Replaced the data-core fixture repositories with PostgreSQL read adapters; write methods fail closed and point to canonical domain services.
- Changed the public orders/data-core metrics surfaces from `SIMULATION`/`in-memory` claims to truthful PostgreSQL behavior, with `503` when the production database is unavailable.
- Centralized the repeated V237 merchant-domain rule engine into `modules/merchant-commerce/kernel.ts`; the 21 domain files are now thin compatibility adapters rather than duplicated rule implementations.
- Added migration `091_v237_reality_consolidation.sql` and updated the migration checksum manifest.
- Added a release gate test that blocks reintroduction of fixture-backed production commerce paths.
- Updated `verify:ci` to run the new reality gate before build/tests.

## Verification performed in this environment

- Migration sequence/checksum verification: **PASS — 91 migrations**.
- V237 reality-consolidation test: **PASS**.
- Modified TypeScript files were syntax-checked successfully with Node's TypeScript stripping where supported.
- Full `npm run typecheck` / `npm test` could not be completed in this environment because the extracted project did not have installed dependencies and `npm ci` exceeded the execution window. This is intentionally reported rather than marked as passing.

## Production-only evidence still required

Source code cannot prove external provider credentials, live payment webhook delivery, database HA/backups, real network latency, or production traffic behavior. Those must be verified in the deployment environment before declaring the system fully production-certified.
