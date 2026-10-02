# TRUST V308 — Global Logistics Control Tower

V308 turns the V304–V307 logistics execution chain into an operational visibility layer.

## Flow

`carrier route → logistics decision → execution → tracking reconciliation → control-tower assessment`

For each shipment the control tower evaluates:
- shipment lifecycle state;
- ETA drift;
- carrier event freshness;
- logistics execution state and retry history;
- open and critical fulfillment exceptions.

It emits a deterministic risk score, `GREEN | AMBER | RED` band, and one bounded operator action.

## Durability

Every explicit snapshot is stored in `trust_global_logistics_control_tower_snapshots` and emits an outbox event.

## APIs

- `GET /api/fulfillment/global-carriers/control-tower?orderId=...` — order view.
- `GET /api/fulfillment/global-carriers/control-tower` — active fleet view.
- `POST /api/fulfillment/global-carriers/control-tower` — persist an order snapshot.

## Validation boundary

The runtime is carrier-agnostic. V308 does not claim live DHL, FedEx, UPS, or other external carrier connectivity, nor live PostgreSQL E2E certification in the current environment.
