# V236 Customer Commerce OS

V236 makes customer-owned commerce state durable and auditable. It adds PostgreSQL-backed profiles, addresses, wishlists, saved carts, reviews, preferences, privacy jobs and a customer timeline.

## Invariants
- Every customer API resolves the current authenticated user and scopes reads/writes by customer id.
- Mutable multi-row workflows use PostgreSQL transactions and row locks where ownership or defaults can race.
- Reviews are validated and moderation-gated; verified purchase status is derived from order data rather than client claims.
- Privacy export/delete requests are durable jobs and deduplicated. Deletion transitions the profile through PENDING_DELETION before irreversible cleanup.
- Saved carts expire through a worker and are never silently treated as active checkout inventory.
- Timeline events provide durable customer-facing history without replacing the canonical domain ledgers.

## Provider posture
No external provider is faked as live. Export artifact storage is represented by an artifact key boundary until object storage is configured.

## Customer Data Platform
V236 also provides a durable customer event ledger, deterministic segmentation, consent eligibility, operator search/context, journey execution and operational maintenance. Events are fingerprinted for deduplication; segments are persisted with evaluation scores; journeys use transactional run locks and channel consent checks.
