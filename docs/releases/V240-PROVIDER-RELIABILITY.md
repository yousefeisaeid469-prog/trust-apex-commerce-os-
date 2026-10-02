# TRUST V240.0.0 — Provider Reliability & Contract Verification

## Scope

V240 hardens the V239 real-provider execution boundary. It does not claim a production provider is certified merely because the generic adapter exists.

## Changes

- Provider readiness now requires both a secret and a base URL.
- Per-provider environment overrides are supported consistently by the readiness gate and registry.
- Added uniqueness guards for durable create-payment and refund provider jobs.
- Added a deterministic HTTP provider contract test covering authentication, idempotency headers, request payloads, response normalization, and refunds.
- Added migration 094 without mutating prior migrations.

## Verification

- Payment provider audit: PASS.
- Production contract audit: PASS.
- Migration check: PASS — 94 contiguous migrations with manifest-compatible checksums.
- Reality consolidation regression test: PASS.
- Provider contract test: PASS.
- TypeScript syntax checks for touched provider/payment files: PASS.

## Remaining deployment requirement

A real external provider still requires provider-specific credentials, base URL, webhook verification configuration, and sandbox/live certification in the deployment environment.
