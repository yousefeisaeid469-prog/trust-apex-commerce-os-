# TRUST V238 — Production Reality Hardening

V238 continues the V237 reality consolidation. The goal is not to inflate feature count; it is to make the canonical runtime truthful, durable, and safer to operate.

## Changes

- Bumped runtime/package version to V238.0.0.
- Added migration 092 without mutating the immutable V091 checksum.
- Hardened checkout quote persistence with forward-compatible `discount_code` storage and expiry validation.
- Made checkout pricing authoritative at commit time and reject stale quote totals with `QUOTE_PRICE_CHANGED`.
- Persisted checkout discount values on orders instead of silently dropping quote discounts.
- Added a dedicated `/api/ready` readiness endpoint that checks production configuration and PostgreSQL connectivity.
- Added database application name, statement timeout, and query timeout configuration.
- Added request IDs and baseline security response headers in middleware.
- Added a production contract audit over all API routes.
- Removed `accepted: true` from simulation endpoints; unsupported surfaces now fail closed with HTTP 501 instead of pretending to execute production work.

## Verification

The local environment successfully verifies:

- 92 canonical migrations with contiguous identity and matching checksums.
- V237 reality consolidation gate.
- V238 production contract audit across 212 API route files.

A full TypeScript/build/test certification still requires a dependency install and, for provider-backed capabilities, real provider credentials and sandbox/live certification.
