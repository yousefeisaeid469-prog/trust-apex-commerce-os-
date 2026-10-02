# TRUST V271.0.0 — Marketplace Discovery Runtime

V271 breaks the audit-only loop by shipping a customer-facing marketplace discovery surface.

## Delivered
- PostgreSQL-backed marketplace search API with relevance, rating, price and newest sorting.
- Arabic-aware query normalization and full-text search.
- Category, merchant, region, price, rating and stock filters.
- Search analytics storing a one-way query hash rather than raw query text.
- Product detail API and customer-facing product pages.
- Related-product discovery.
- Real add-to-cart path from product pages.
- Search/product indexes in migration 108.

## Boundary
This release does not claim Amazon parity. Advertising, subscriptions, fulfillment economics and B2B foundations from earlier releases are not treated as complete customer experiences merely because their schemas exist.
