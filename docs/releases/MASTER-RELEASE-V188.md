# TRUST APEX OS — V188 Provider Capability Registry

V188 makes external execution provider selection explicit and fail-closed.

- Durable provider registry with SANDBOX/LIVE separation.
- Explicit payment, fulfillment and support capabilities.
- Certification and health gates before live execution.
- Certification expiry is enforced.
- PostgreSQL persistence with unique provider/environment identity.
- Deterministic repository tests cover readiness and persistence semantics.

## Verification
V188 is validated by repository tests, migration checks, contract checks and the release gate. No live PSP/carrier credentials or production provider certification are claimed.
