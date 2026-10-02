## V414.0.0 — Global External Effect Recovery Plane
- Extended durable external-effect intents to payout provider execution.
- Added explicit FAILED transitions for provider-effect failures.
- Added lease-expiry fencing/recovery worker and recovery snapshot views.
- Added operations API at `/api/runtime/external-effects`.
- Added V414 test, audit and release gate.

## V392.0.0 — Load & Resilience Hardening

- Added bounded-retry/idempotency load-resilience model and audit.
- Keeps live PostgreSQL integration explicitly separate from deterministic load testing.

# TRUST V305 — Global Logistics Intelligence

See CHANGELOG-V305.md for this release.


## V413.0.0 — Global Transaction Consistency Mesh
- Added durable transactional outbox event keys and unique deduplication.
- Added external effect intent ledger with fingerprints, leases, retries and completion events.
- Wired command requests and order-journey events through the transactional outbox helper.
- Wired payment-provider create/refund execution through durable external-effect intents.
- Added V413 consistency tests, audit and release gate.


## V415.0.0 — Global Commerce Domain Kernel

- Added canonical commerce domain snapshot across cart, quote, order, payment, inventory/execution and runtime truth.
- Added protected `/api/commerce/domain` operational surface.
- Added V415 test, audit and release gate.
- No new business-state authority was introduced; existing PostgreSQL authorities remain canonical.

## V416.0.0 — Canonical Commerce Execution Path
- Added `modules/commerce/core/canonical-commerce-kernel.ts` as the production write boundary for local and global quote checkout.
- Production checkout callers now cross the canonical kernel instead of importing transaction implementations directly.
- Added `trust_commerce_execution_receipts` migration 241 to durably record canonical checkout commits without creating a second order/payment authority.
- Added V416 canonical execution test, audit, and release gate with direct-bypass detection.
- Full TypeScript/build and live PostgreSQL validation remain environment-dependent and are not claimed when dependencies/database are unavailable.

## V417.0.0 — Global Commerce Execution Graph & Integrity
- Added durable cross-domain execution graph projection over authoritative commerce state.
- Added integrity gap detection for checkout, payment, inventory, execution, fulfillment, delivery, settlement and runtime.
- Synced graph inside canonical checkout, captured-payment execution and delivered-shipment transactions.
- Added authenticated execution-graph API.
- Added V417 execution graph test/audit/release gate.

## V418.0.0 — Global Commerce Recovery & Reconciliation Engine
- Added bounded, idempotent `trust_commerce_recovery_plans` with leases, fencing tokens, retry ceilings, and durable outcomes.
- Added reconciliation from V417 execution-graph gaps into recovery cases and repair plans.
- Added safe automated actions for missing runtime operations and resumable commerce execution; unsafe gaps are explicitly blocked rather than synthesized.
- Added recovery engine worker and operator snapshot API.
- Migration 243 is canonical and checksum-verified.


## V419.0.0 — GLOBAL COMMERCE STATE MACHINE + EVENT/COMMAND RECONCILIATION
- Added canonical commerce state derivation over existing order/payment/execution/fulfillment/delivery/settlement/runtime authorities.
- Added durable reconciliation projection and append-only reconciliation events.
- Added idempotent outbox signal for detected state drift.
- Fixed order-journey delivery completion to recover the delivered shipment id when the workflow payload omits it.
- No new commerce truth authority is introduced.
