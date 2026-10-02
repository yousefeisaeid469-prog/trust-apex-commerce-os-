# TRUST V150 — Production Control Plane

Release 150 introduces the durable production control plane: transactional PostgreSQL leases and idempotency, reliability-gated promotion, automatic rollback with recovery verification, OTLP/HTTP telemetry export boundary, and deterministic evidence.

Verification commands:
- `npm test`
- `npm run production-control-plane-audit`
- `npm run migration-check`
- `npm run release-gate`
- `npm run production-control-plane`

Production activation additionally requires real infrastructure credentials, RBAC, traffic provider configuration, database connectivity, telemetry endpoint configuration, and independent operational validation.
