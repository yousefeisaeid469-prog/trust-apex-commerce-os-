# V89 Platform Control Plane

## New contracts
- `modules/platform/tenancy/context.ts`: explicit tenant context and access checks.
- `modules/platform/observability/health.ts`: deterministic health aggregation.
- `modules/platform/security/input-policy.ts`: bounded Unicode normalization and slug validation.

## Operator surface
- `/platform-control` shows runtime diagnostics.
- `/api/platform/diagnostics` returns non-secret health information.

## Security posture
No secret values are returned by the diagnostic endpoint. Configuration checks report only presence/state.
