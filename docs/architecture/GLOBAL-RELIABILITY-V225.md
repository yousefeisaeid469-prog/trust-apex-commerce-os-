# TRUST V225 — Global Reliability & Disaster Recovery

V225 adds a provider-neutral reliability layer for multi-region failure handling.

## Controls
- Region health classification and traffic awareness.
- RTO/RPO objectives with explicit evidence state.
- Backup evidence and restore-test tracking.
- Failover and restore plans that remain approval-gated.
- Recovery-drill records and failed-drill warnings.
- Durable PostgreSQL evidence tables via migration 076.

## Honesty boundary
V225 does not claim that a real region failed over, a backup restored, or traffic moved unless external evidence is supplied. The default API is intentionally evidence-aware.
