# V310 — Global Logistics Promise Enforcement

V310 adds delivery-promise intelligence on top of V308 control-tower risk and V309 recovery.

## Delivered
- shipment `promised_at` persistence with safe backfill from ETA
- deterministic ETA-versus-promise slack calculation
- ON_TRACK / AT_RISK / BREACH classification
- promise risk scoring using logistics risk and exceptions
- durable idempotent promise enforcement actions
- carrier replan, acceleration, and breach escalation outbox dispatch
- preview/enforce/status API
- regression tests, audit, migration manifest and release-gate integration

## Boundary
No live carrier/provider execution or full PostgreSQL E2E certification is claimed.
