# TRUST V295 — Production Hardening

V295 adds an adversarial hardening evidence layer for concurrency, replay, ledger, failure-recovery and deterministic load checks.

## Invariants
- A single inventory unit cannot be reserved twice by concurrent checkout attempts.
- Payment and webhook event identifiers are applied at most once.
- Financial journal entries must balance debit and credit totals.
- A failed pre-commit attempt followed by retry must not create duplicate effects.
- The deterministic load harness records 1,000 requests and reports a p95 latency sample.

## Evidence boundary
The bundled V295 runner is deliberately labelled `DETERMINISTIC_LOCAL`. It does **not** claim live PostgreSQL concurrency certification, provider certification, production traffic load certification, or backup/restore certification. Those require an environment with real infrastructure and must be recorded as separate evidence campaigns.
