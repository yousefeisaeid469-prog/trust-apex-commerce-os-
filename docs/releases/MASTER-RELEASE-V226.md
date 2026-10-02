# TRUST APEX OS — V226 Owner Control Room

V226 establishes a dedicated owner-only control room on top of the existing admin session boundary.

## Security boundary
- `/owner-control-room` and `/api/owner-control-room` require a valid admin session **and** an explicit `TRUST_OWNER_EMAILS` allowlist match.
- UI visibility is not the security boundary; server-side authorization is.
- High-impact controls are approval-gated and do not execute provider side effects directly from the room.

## Audit
- Migration 077 adds `trust_owner_audit_events`.
- Audit records are append-only and hash-chained with previous hash, payload hash and event hash.

## Controls
System health, global reliability, revenue, commerce, AI/autonomy, security/fraud, providers, maintenance mode, global freeze and autonomy kill switch.

## Honest boundary
V226 does not claim that a control was executed merely because an owner requested it. Execution remains behind existing approval/provider gates.
