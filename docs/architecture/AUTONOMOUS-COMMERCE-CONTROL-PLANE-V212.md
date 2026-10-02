# Autonomous Commerce Control Plane — V212

V212 is the orchestration layer between the V211 Commerce Brain and existing authorization/execution infrastructure.

## Flow
1. Accept commerce events.
2. Derive explainable Brain signals with freshness metadata.
3. Convert Brain actions into tenant-scoped decisions.
4. Apply risk/confidence policy and explicit autonomous-action allowlists.
5. Produce an execution intent rather than invoking a provider.
6. Mark reconciliation as awaiting provider only for READY intents.
7. Produce learning hints only from fresh evidence.

## Truth boundary
The Control Plane does not claim external execution. Provider adapters, credentials, approval systems, durable queues, and reconciliation workers remain the actual side-effect boundary.

## Idempotency
Decision and command identifiers are deterministic from tenant, action, and evidence. Duplicate event handling remains owned by the Commerce Brain input boundary.
