# TRUST V283.0.0 — Economic Settlement Runtime

V283 wires the V282 economic core into captured-payment settlement.

## Delivered
- Captured payment → idempotent marketplace settlement.
- Per-seller fee assessment from durable fee rules.
- Seller pending balance credits after capture.
- Customer charge + seller credit + platform/payment/fulfillment/return fee ledger entries.
- Durable settlement receipt with one-per-payment uniqueness.
- Settlement outbox event for downstream reconciliation.
- Pure economic invariant tests.

## Boundary
External payment providers, tax calculation, actual payout rails, and carrier billing remain integration boundaries; V283 does not pretend those external systems are certified merely because the internal ledger is durable.
