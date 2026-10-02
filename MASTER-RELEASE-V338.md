# TRUST APEX OS — V338

## Discovery Search Upgrade

V338 upgrades the customer-facing marketplace discovery path. It reuses the V337 PostgreSQL search vector and connects it to the actual marketplace search API and shop UI.

### Runtime
- Indexed full-text product search.
- Merchant-name matching.
- Price range, minimum rating, tag and stock filters.
- Deterministic sorting.
- Filter-aware category facets.
- UI controls for the new discovery surface.

### Verification boundary
The search path requires the V337 migration to have been applied. No claim is made that external search infrastructure is configured.
