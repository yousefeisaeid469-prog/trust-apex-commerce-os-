# V375.0.0 — Global Commerce Control Plane

## Implemented
- Added a platform-wide cross-domain operational control plane over the existing commerce authorities.
- Added live aggregation for orders, payments, inventory, seller orders, fulfillment, delivery, events, execution and revenue.
- Added deterministic incident detection for stale consumer/execution work.
- Added a bounded command registry with explicit risk, authorization and mutation-boundary metadata.
- Added owner-authenticated `RECOVER_ORDER_LEASES`, delegating execution exclusively to the existing V373 verified order-recovery authority.
- Added durable command evidence in `trust_global_commerce_control_commands`.
- Added read-only control-plane UI and API endpoints.
- Added current-head audit and regression tests.

## Authority boundary
V375 does not become a second order, payment, inventory, fulfillment or revenue authority. It observes those systems and coordinates only bounded recovery already implemented by V373.
