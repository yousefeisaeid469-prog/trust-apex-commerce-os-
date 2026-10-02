# TRUST V134 — Product Maturity Matrix

| Domain | State | Evidence boundary |
|---|---|---|
| Identity / sessions | Production-oriented | PostgreSQL persistence + auth controls |
| Checkout | Transactional | row locks + idempotency + inventory reservation |
| Payments | Production-oriented | state machine + idempotent provider events |
| Refunds | Production-oriented | request/settlement separation + provider confirmation path |
| Inventory | Transactional | reservation + ledger + failure release |
| Durable jobs | Production-oriented | PostgreSQL queue + leases + retries |
| Audit / decision fabric | Production-oriented | durable records + hashes + outbox |
| Merchant OS | Broad foundation | multiple capability modules; provider integrations require deployment verification |
| AI / intelligence | Foundation / orchestration | models and contracts are present; external model/provider evidence is environment-dependent |
| Logistics | Foundation / integration-ready | real carrier execution requires provider credentials and tests |
| Observability | Production-oriented | request IDs, health/readiness, telemetry contracts; external backend requires configuration |
| Security | Hardened foundation | route auth and invariants; penetration testing remains required |
| DR / chaos | Not yet environment-proven | requires deployed infrastructure drills |
| Commercial proof | Not represented by source code | requires actual revenue, customers and retention evidence |
