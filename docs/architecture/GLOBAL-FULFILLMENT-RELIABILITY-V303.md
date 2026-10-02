# TRUST V303 — Global Fulfillment Reliability

V303 adds durable exception management, idempotent recovery actions, and order-level fulfillment health snapshots on top of V302 aggregate delivery execution.

The runtime records carrier/fulfillment exceptions, supports controlled recovery actions with bounded retries, escalates exhausted actions, and computes GREEN/AMBER/RED fulfillment health. It is designed to be provider-neutral; real carrier execution remains an environment-dependent adapter boundary.
