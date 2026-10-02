# TRUST V315 — Verification Platform

V315 establishes an executable verification layer around critical commerce workflows.

## Capabilities
- Payment and carrier deterministic sandbox adapters.
- Failure injection for payment provider, carrier, database, outbox, network and worker boundaries.
- Event replay with canonical state hashing and determinism checks.
- Load summary with p50/p95/error-rate gates.
- PostgreSQL probe and transaction-rollback harness when `DATABASE_URL` is available.
- Durable verification run/result/evidence storage.
- Verification catalog exposed through `/api/platform/v315/verification`.

## Evidence boundary
The repository contains sandbox-capable tests and a live PostgreSQL harness. Live-only checks are explicitly marked `SKIPPED` when credentials/infrastructure are absent. V315 does not claim live payment-provider or carrier connectivity.

## Anti-duplication rule
Verification is contract-driven. New workflows should register a small set of meaningful cases rather than generating repetitive domain files with renamed logic.
