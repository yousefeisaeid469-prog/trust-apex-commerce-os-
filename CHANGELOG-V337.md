# V337 — Production Catalog Search Runtime

## Runtime changes
- PostgreSQL `tsvector` search index for active products.
- Web-search style product queries instead of unbounded `ILIKE` scans.
- Price range, stock, tag, category, merchant and deterministic sort filters.
- Relevance/newest/price/rating ordering.
- Category facets over the active filtered catalog.
- Public `/api/products` exposes the real filters, facets and pagination metadata.

## Truth boundary
This release changes runtime catalog discovery. It does not claim external search infrastructure is configured.
