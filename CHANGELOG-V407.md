# V407.0.0 — Global Runtime Spine

V407 unifies durable execution telemetry/control for the V404 command bus and V405/V406 workflow runtime.

## Real implementation
- Added `trust_runtime_operations` with tenant-scoped operation identity and lifecycle.
- Added immutable `trust_runtime_operation_events` execution journal.
- Added `trust_runtime_operation_snapshot` read view.
- Every newly accepted command gets a durable runtime operation keyed by command id.
- Command worker records started, retry/waiting, succeeded and dead execution stages.
- Every newly started workflow gets a durable runtime operation keyed by workflow id.
- Workflow worker records execution/waiting/compensation/success/failure stages.
- Added authenticated operations APIs for runtime overview and individual operation timelines.
- Added V407 audit, test and release gate.

## Truth boundary
Runtime Spine is execution/control telemetry. Orders, payments, inventory, fulfillment and settlement remain authoritative in their existing domain tables.

## Verification limits
Static/node checks do not prove live PostgreSQL behavior. A real `DATABASE_URL` is still required for integration validation.
