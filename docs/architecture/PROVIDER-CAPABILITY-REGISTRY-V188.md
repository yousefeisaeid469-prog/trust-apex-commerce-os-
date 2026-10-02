# Provider Capability Registry — V188

V188 adds an explicit provider readiness boundary between execution intent and external provider adapters.

## Guarantees
- Provider identity is registered per environment (`SANDBOX` or `LIVE`).
- Every executable capability is explicit rather than inferred from adapter names.
- Certification is fail-closed: only `PASSED` providers are ready.
- Live execution additionally requires `HEALTHY` provider health.
- Certification expiry blocks execution.
- Registrations are durable in PostgreSQL and keyed by `(provider, environment)`.

## Sandbox policy
A sandbox adapter may be used for deterministic integration testing, but it must be registered as `SANDBOX`. It is never evidence of live PSP/carrier connectivity or production certification.

## Production boundary
V188 does not invent provider credentials or claim live certification. A real provider integration becomes eligible for `LIVE` only after its adapter, credentials, health checks, and certification evidence are supplied by the deployment environment.
