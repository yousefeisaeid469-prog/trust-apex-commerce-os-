# V313 — Platform Foundation

## Added
- Production deployment primitives: multi-region failover selection, reliability gates, backup/restore drill evidence, Kubernetes rolling deployment, PDB/HPA, health probes and OpenTelemetry wiring.
- Payment platform primitives: provider routing/failover, idempotent financial operations, double-entry journal validation, provider reconciliation and settlement journal construction.
- Logistics network primitives: carrier optimization, reroute decisions and warehouse/inventory allocation.
- AI decision loop: Observe → Predict → Decide → Act → Verify → Learn with confidence/risk and human-approval gating.
- Risk platform: account/payment/seller/device/graph signals with explainable real-time score bands.
- Multi-country commerce: currency, language, tax model, checkout method and regional catalog profile.
- Security: permission authorization, security event pipeline contract and key rotation primitive.
- Tenant isolation invariant and active-tenant gate.
- Analytics event normalization and deterministic aggregation.
- Critical workflow evidence hashing and CI evidence workflow.

## Verification boundary
No live provider, live carrier, live Kubernetes cluster, or live PostgreSQL certification is claimed by V313. Those are environment-dependent integration stages.
