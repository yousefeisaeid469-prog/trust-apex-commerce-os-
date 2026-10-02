# TRUST V120 — Observability & Disaster Recovery

## Telemetry
`/api/ops/telemetry` is admin-gated. Set `TRUST_INCIDENT_WEBHOOK_URL` to route critical incident payloads to PagerDuty-compatible/custom webhook infrastructure.

## SLO starting point
- API availability target: 99.9%
- p95 API latency target: < 500 ms for read APIs
- webhook acknowledgement target: < 2 s
- error budget and alert thresholds must be tuned from production traffic, not guessed.

## Backup / recovery runbook
1. Enable PostgreSQL point-in-time recovery and automated snapshots.
2. Maintain an encrypted off-site backup copy.
3. Test restore into an isolated environment on a scheduled cadence.
4. Validate migrations against the restored database before promotion.
5. Rebuild application instances from immutable release artifacts.
6. Replay idempotent outbox/events where required.
7. Verify payment, order, inventory and fulfillment invariants.
8. Switch traffic only after health and data-integrity checks pass.

Zero-downtime deployment requires compatible expand/contract migrations, health-gated rollout, and rollback plans; a document alone does not guarantee zero downtime.
