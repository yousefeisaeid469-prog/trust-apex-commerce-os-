# TRUST V134 — SLO / DR Plan

## Proposed launch SLOs
- Availability: 99.9% monthly for customer-facing APIs.
- Readiness: database connectivity and mandatory auth configuration must pass.
- Checkout: p95 < 500ms excluding external payment-provider latency.
- Webhook acknowledgement: p95 < 1s when database is healthy.
- Durable job recovery: expired leases reclaimed within 2 minutes.

These are **targets**, not measured production results.

## Recovery objectives
- Target RPO: ≤ 15 minutes.
- Target RTO: ≤ 60 minutes.

## Required drills
1. Database restore from backup.
2. Application rollback to previous release.
3. Worker crash during a leased job.
4. Payment webhook replay and out-of-order delivery.
5. Outbox backlog recovery.
6. Secret rotation.
7. Regional/provider outage simulation.

## Evidence
Every drill should produce timestamped evidence, command output, environment identifier, operator and result, and should be stored in the release evidence record.
