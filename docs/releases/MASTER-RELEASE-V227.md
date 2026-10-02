# TRUST APEX OS — V227.0.0

## Owner Control Room 2.0 — Live Control Plane

V227 upgrades the V226 owner room from request-only controls to a durable owner live-control state for three emergency controls: maintenance mode, global freeze, and autonomy kill switch.

### Delivered
- Owner-only server authorization remains mandatory.
- Durable singleton `trust_owner_live_control_state`.
- Owner commands can explicitly enable/disable maintenance, global freeze, and autonomy kill switch.
- Changes are written transactionally and paired with the existing immutable owner audit chain.
- Existing admin control mode is synchronized with live owner controls.
- UI shows live safety state and requires an explicit confirmation marker for state-changing commands.

### Honest boundary
The durable control state is real when PostgreSQL is configured. This release does not claim that every commerce mutation route automatically enforces every control mode; downstream enforcement remains a separate integration boundary. No provider-side action is fabricated.

## Verification
- V227 focused tests: 4/4
- Migration: 78
- Contract: 37
- Owner control-room script: PASS
