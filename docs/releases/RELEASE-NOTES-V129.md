# TRUST V129 — Production Integrity

V129 is a runtime-hardening release focused on closing the gap between TRUST's feature surface and its durable infrastructure.

## Major changes

### Durable persistence
- Replaced in-memory authoritative auth/session state with PostgreSQL.
- Added durable carts, customer profiles, merchant profiles/onboarding, reviews, returns and payment intents.
- Persisted agent approvals/messages/policy state.
- Persisted private admin control mode and distributed login throttling.

### Evidence & Decision Fabric
- Added strict evidence validation and tenant binding.
- Client JSON cannot self-attest as trusted system/provider evidence.
- Added evidence content hashing.
- Decision evaluation now persists evidence and decisions transactionally.
- Added hash-linked audit chain and durable outbox emission.
- Decision endpoints no longer claim simulated records were persisted.

### Security
- Added explicit authorization to sensitive Fabric/control surfaces.
- Fixed the refund route's unreachable execution bug.
- Completed TOTP input flow in the admin login UI.
- Added an allow-list for admin post-login destinations.
- Added support for a PBKDF2 admin password hash via `TRUST_ADMIN_PASSWORD_HASH`.

### Release integrity
- Canonicalized root migration numbering to a contiguous sequence.
- Archived the duplicate historical V125 prevention migration instead of silently deleting it.
- Added `db/migrations/MANIFEST.json` checksums and a transactional migration runner.
- Consolidated historical release notes/checklists under `docs/releases/`.
- Added `MASTER-RELEASE.md` as the current source-of-truth index.
- Removed stale `tsc.txt` error evidence.

### Verification
- Added executable Node tests covering evidence trust boundaries, decision invariants, migration identity and critical source contracts.
- Added a private Production Integrity Center backed by database counts.

## Production boundary

V129 is materially stronger, but it is still not a declaration of full production readiness. Real provider attestations, payment/carrier integrations, database-backed deployment, comprehensive E2E/security/load testing, secret rotation, and operational SLO/DR validation remain deployment work.
