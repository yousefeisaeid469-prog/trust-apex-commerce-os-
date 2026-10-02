# TRUST APEX OS — V212
## Autonomous Commerce Control Plane

V212 adds the control loop above V211 Commerce Brain:

`event → signal → decision → policy authorization → execution intent → reconciliation expectation → learning hint`

### Guarantees
- Tenant isolation is checked before authorization.
- Risk and confidence ceilings are deterministic.
- Autonomous actions are allowlisted explicitly by policy.
- Approval-required actions never become executable side effects.
- READY means an execution intent is policy-ready; it does not mean an external provider succeeded.
- Reconciliation is expected only after a real provider result exists.
- UNKNOWN/stale signals are not used as learning evidence.
- No payment, refund, fulfillment, messaging, or other external side effect is performed by the Control Plane itself.

### Runtime
- Version: `V212.0.0`
- Release: `autonomous-commerce-control-plane`
- API: `/api/autonomous-commerce-control-plane`
- UI: `/autonomous-commerce-control-plane`
