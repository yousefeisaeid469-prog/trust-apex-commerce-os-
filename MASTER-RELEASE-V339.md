# TRUST APEX OS — V339

## Concrete runtime delivered

V339 adds a merchant-owned offer management runtime for the marketplace. It is not an audit-only release.

### Seller operations
- List the seller's marketplace offers with lifecycle filtering and cursor pagination.
- Read persisted change history for an owned offer.
- Update price, shipping fee, stock, handling time, delivery window, fulfillment mode and status.

### Integrity controls
- Every offer has a durable integer `revision`.
- Updates lock the offer row with `FOR UPDATE` and require the expected revision when supplied.
- The final `UPDATE` also checks the revision, so concurrent writes cannot silently overwrite each other.
- Every post-migration offer creation is recorded by a database trigger.
- Every management update writes a before/after change record with actor, merchant, revision and change type.
- Offer reads and mutations are merchant-scoped.

### Runtime surface
- `GET /api/marketplace/offers/manage`
- `GET /api/marketplace/offers/manage?offerId=<id>`
- `PATCH /api/marketplace/offers/manage`

### Verification
`tests/v339-offer-management.test.mjs` passes, alongside the V333/V337/V338 regression tests used for the immediately preceding money/search surfaces.

The repository archive does not contain installed npm dependencies, so a full TypeScript/build verification was not claimed here. The current source-level regression suite passes 5/5.
