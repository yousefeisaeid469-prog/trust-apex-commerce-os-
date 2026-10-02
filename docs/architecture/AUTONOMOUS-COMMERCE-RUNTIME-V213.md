# Autonomous Commerce Runtime — V213

V213 is the runtime boundary between the V212 Control Plane and the existing Execution Adapter Mesh.

## Flow
`event → V211 brain → V212 control decision → execution intent → V213 runtime command → adapter mesh → provider result → reconciliation`

## Guarantees
- Only `READY` intents can reach the adapter mesh.
- `PENDING_APPROVAL` becomes `APPROVAL_REQUIRED`; it is never dispatched.
- `BLOCKED` remains blocked.
- Missing adapters produce `NOT_DISPATCHED`, never a fabricated success.
- Provider success is reported only from an injected adapter result.
- Existing adapter retry, circuit-breaker and idempotency semantics are reused.
- The runtime itself performs no direct payment, refund, fulfillment or messaging side effect.
