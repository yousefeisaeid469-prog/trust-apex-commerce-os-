# TRUST V247 — Reality Proof & Contract Enforcement

V247 strengthens the V244/V246 consumer-mesh implementation by making event contract validation executable rather than a top-level object check, and by adding a release audit that proves the claimed runtime paths are present and wired.

## Runtime proof
- Consumer subscriptions and retry policy are read from PostgreSQL.
- Publisher fan-out is created from enabled database subscriptions.
- Consumer workers load the subscription policy before processing.
- Durable event writes validate the registered event schema before insertion.
- Schema validation supports type, required properties, nested properties/items, enums, and closed objects.
- Aggregate ordering remains enforced by transactional advisory locking plus delivery-claim ordering guards.
- Failure paths persist retry/dead-letter evidence.
- Release-gate coverage explicitly includes V246 and V247 artifacts.

## Boundary
Source-level audits prove code-path presence and contract behavior. They do not claim that a production database, provider credentials, worker fleet, or external infrastructure is currently running.
