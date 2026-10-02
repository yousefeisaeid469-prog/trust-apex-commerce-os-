# V307 — Global Logistics Tracking Reconciliation

V307 adds the post-label carrier-event control plane:

- durable carrier tracking receipt ledger
- carrier + external event idempotency
- stale/out-of-order protection
- unmatched event retention
- atomic shipment tracking reconciliation
- fulfillment exception integration
- global delivery/settlement integration
- carrier webhook ingestion API
- order tracking/reconciliation summary API

Validation performed:
- V304 regression test PASS
- V305 regression test PASS
- V306 regression test PASS
- V307 test PASS
- migration check PASS (145 migrations)
- release gate PASS
- V307 TypeScript syntax checks PASS

Not certified here:
- full `tsc --noEmit` (dependencies are not installed)
- live PostgreSQL E2E
- live DHL/FedEx/UPS webhook connectivity
