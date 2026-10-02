# V129 — Production Integrity Architecture

## Runtime guarantee model

TRUST V129 treats the following as a single transactional path for sensitive decisions:

`request → authentication → tenant binding → evidence validation → provenance boundary → policy evaluation → decision → PostgreSQL ledger → audit chain → outbox`

A successful durable response is not allowed to claim persistence when the database write did not occur.

## Evidence trust boundary

Client input is untrusted. A client may submit an observation, but it cannot promote that observation to `VERIFIED` by setting a field in JSON. Trusted system/provider evidence must enter through a server-controlled ingress path and carry provenance/attestation metadata.

## Durable state

Critical state moved from process memory to PostgreSQL in V129:

- users
- sessions
- carts
- reviews
- returns
- merchant profiles
- merchant onboarding
- payment intents
- agent approvals/messages/policy state
- admin control mode
- admin login throttling
- decision/evidence records
- audit chain
- outbox events

Pure in-process `Map` objects that remain in the repository are explicitly non-authoritative caches, algorithms, or development adapters and must not be used as the source of truth for security, money, identity, or control state.

## Migration integrity

`db/migrations/` is the only canonical application migration root. Migration identity is three-digit contiguous numbering plus a checksum manifest. The runner records applied checksums and refuses drift.

The historical duplicate V125 prevention migration remains archived under `db/migrations/archive/legacy-duplicates/` rather than being silently discarded.

## Testing boundary

V129 adds executable tests for evidence trust, decision invariants, migration identity, and critical source contracts. These tests complement—not replace—database integration, provider webhook, load, security, and browser E2E testing required before a real production launch.
