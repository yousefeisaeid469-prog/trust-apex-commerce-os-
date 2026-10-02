# TRUST APEX OS — V211 Real-Time Commerce Brain

## What shipped
- Event-driven commerce signal layer above the V210 Global Commerce Graph.
- Deterministic event normalization and idempotency deduplication.
- Freshness-aware signals with `asOf`, `staleAfter`, confidence, evidence, and source event IDs.
- Next-best-action routing to existing Marketplace Intelligence, Problem Center, Seller Super OS, and TRUST Network surfaces.
- Explicit separation between decision support and sensitive execution.

## Truth boundary
V211 is real-time only when the API receives actual commerce events. An empty or stale input is reported as not fresh/unknown rather than fabricated as live state. No payment, refund, fulfillment, messaging, or other financial side effect is executed by the brain.

## Verification
- V211 focused tests: 4/4 PASS.
- Full npm test suite: pending final release-gate run after package/runtime metadata update.
- Build/typecheck: not verified in this environment because dependencies may be absent.
