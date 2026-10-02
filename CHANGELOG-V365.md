# TRUST V365.0.0 — PRODUCTION COMMERCE WIRING PROOF

V365 closes the gap between “module exists” and “production commerce flow calls it” by making the current wiring chain explicit and machine-verifiable.

## Current production chain
- Checkout creates the durable `order.created` outbox event.
- `scripts/commerce_event_publisher.mjs` normalizes the event to `ORDER_PLACED` and appends it to the durable event store.
- `appendEventTx` now enqueues enabled consumer deliveries in the same database transaction.
- `commerce-intelligence` is the production consumer for ORDER_PLACED, PAYMENT_CONFIRMED, DELIVERED, and RETURN_REQUESTED.
- The intelligence consumer invokes Commerce Brain, Growth Network, Global Commerce Graph, Revenue Autopilot, Revenue Intelligence, Commerce Growth OS, and Commerce AI Copilot, then persists a durable snapshot.
- The Autonomous Commerce Orchestrator has its own durable consumer entrypoint and persisted orchestration state.

## Reality proof
Added `scripts/current_commerce_wiring_audit.mjs` and `tests/v365-current-commerce-wiring.test.mjs`. These assert the caller chain rather than merely checking for module files or presentation pages.

No new migration is required for V365; the runtime uses the V364 schema.
