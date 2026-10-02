# V223 Operations

## Required production evidence
1. Feed real request/job/provider telemetry into `/api/observability`.
2. Configure SLOs per critical path.
3. Supply region health from trusted infrastructure checks.
4. Persist telemetry with PostgreSQL migration 074.
5. Connect dashboards/alerts to the incident signals.

## Safety
Do not place credentials, authorization headers, payment data, personal contact fields, or secrets in telemetry attributes. The application redacts common sensitive keys, but producers should avoid sending sensitive values entirely.

## Incident handling
- SEV1 blocks readiness.
- SEV2–SEV4 remain warnings until resolved.
- A region with >=10% error rate is treated as outage; >=3% or P95 >1000ms is degraded.
