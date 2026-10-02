# TRUST V364.0.0 — REAL COMMERCE INTELLIGENCE WIRING

V364 connects the restored intelligence runtimes to the real durable commerce event path.

## Runtime wiring
- Added `commerce-intelligence` durable consumer.
- Subscribed it to ORDER_PLACED, PAYMENT_CONFIRMED, DELIVERED, and RETURN_REQUESTED.
- Subscribed the durable autonomous-commerce-orchestrator to the same real commerce events.
- The checkout already emits `order.created`; the outbox publisher normalizes it to `ORDER_PLACED`, creates durable deliveries, and the consumer mesh now executes the restored runtimes.

## Restored modules now invoked by production-shaped flow
- Commerce Brain
- Growth Network
- Global Commerce Graph
- Revenue Autopilot planning
- Revenue Intelligence economics/scenarios
- Commerce Growth OS
- Commerce AI Copilot composition
- Autonomous Commerce Orchestrator

## Persistence
- Added `trust_commerce_intelligence_snapshots` as a durable read model.
- Snapshot writes are idempotent by `(tenant_id,event_id)`.
- No fake success, external provider execution, or fabricated revenue is introduced.

## Verification
- 194 canonical migrations.
- Migration identity/checksum validation required.
- Current-head version consistency required.
- V364 wiring tests cover consumer registration and commerce-shaped runtime composition.
