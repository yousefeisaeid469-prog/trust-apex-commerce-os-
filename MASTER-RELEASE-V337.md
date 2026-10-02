# TRUST APEX OS — V337

## Production Catalog Search Runtime

V337 turns the public catalog search from a simple `ILIKE` scan into a PostgreSQL-native indexed discovery path. Existing product truth is preserved.

### Implemented
- Generated `search_vector` on `trust_products`.
- Partial GIN index for active products.
- Search, filters, sorting and category facets in `queryCatalog`.
- Public API validation for price ranges.
- Pagination metadata and explicit filter state.

### Verification boundary
The migration requires PostgreSQL `tsvector` support. A deployment must run migrations before using the new search path. Full production readiness still depends on the actual database and provider configuration.
