# TRUST APEX OS — V213
## Autonomous Commerce Runtime

V213 connects V212 policy-ready execution intents to the existing Execution Adapter Mesh without bypassing approval, provider, idempotency, retry, or reconciliation boundaries.

### Verification
- V213 focused tests: 4/4
- Missing adapter: explicit `NOT_DISPATCHED`
- Approval-required intents: never dispatched
- Provider success: only from injected adapter result

Runtime: `V213.0.0`
API: `/api/autonomous-commerce-runtime`
UI: `/autonomous-commerce-runtime`
