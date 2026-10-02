# Owner Control Room V227

V227 adds a durable owner live-control state beneath the V226 owner-only room.

## State
- `maintenanceMode`: controlled maintenance/read-only intent.
- `globalFreeze`: high-impact commerce freeze intent.
- `autonomyKillSwitch`: autonomous execution disable intent.

The state is a singleton PostgreSQL record with a monotonically increasing version and last actor/reason.

## Security
All API access continues through `requireOwnerSession()`, backed by the owner email allowlist. State-changing requests require an explicit confirmation marker. Every accepted, blocked, failed, or inspected action is written to the V226 append-only hash chain.

## Integration boundary
The owner state is authoritative control-plane state, but individual mutation/execution domains must consume it before performing sensitive work. V227 intentionally does not pretend to have magically enforced the flag across every existing route.
