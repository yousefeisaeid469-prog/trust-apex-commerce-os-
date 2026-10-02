# V384.0.0 — Marketplace Experience Unification

V384 turns the customer-facing marketplace search surface into one canonical, database-backed experience.

## Runtime changes
- Replaced the legacy static `/api/catalog/search` demo payload with the real marketplace discovery authority.
- Added `/api/catalog/suggestions` backed by the real catalog/ranking runtime.
- Homepage search now executes against the canonical catalog endpoint and uses server-backed suggestions.
- `/shop` now preserves search/filter/sort/page state in the URL and exposes real pagination.
- Search, filtering, ranking and personalization continue to use the existing marketplace discovery authority rather than creating a second ranking engine.

## Verification
- V384 marketplace experience audit: 10/10.
- V384 marketplace experience test: 1/1.
- No live PostgreSQL production run was performed in the build environment; database-backed execution remains environment-dependent.
