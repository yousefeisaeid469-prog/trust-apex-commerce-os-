# TRUST APEX OS V328.0.0 — Inventory Reservation Runtime

V328 is an additive commerce/runtime release. It closes the inventory-reservation lifecycle gap without creating an audit-only layer.

## Runtime changes
- Card-payment capture now consumes outstanding order inventory reservations inside the same database transaction as commerce execution.
- Failed payment releases use one canonical reservation service, restoring product/offer inventory and writing a release ledger entry.
- Expired card-checkout reservations are reclaimed with PostgreSQL `FOR UPDATE SKIP LOCKED`, preventing double release across workers.
- Every reservation transition has a durable lifecycle event with an idempotency key.
- Expiration emits a durable outbox event for downstream inventory/customer operations.
- Added an operational API for admin inventory-reservation status and a one-pass expiry trigger.
- Added a worker entrypoint for continuous reservation expiry.

## Verification boundary
Source-level tests and migration checks are expected to pass in the archive. A real PostgreSQL integration run is still required to certify live concurrency behavior and actual stock restoration.

No external provider connectivity is claimed by this release.
