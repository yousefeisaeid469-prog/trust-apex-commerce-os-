# TRUST V162 — Global Discovery Engine

V162 upgrades catalog discovery from simple client-side substring filtering into a deterministic, explainable ranking layer.

## Added

- Unicode-aware normalization for Arabic and Latin search terms.
- Exact, phrase, prefix, token, tag, category and merchant matching.
- Lightweight typo/fuzzy token tolerance without pretending to be an embedding model.
- Commerce filters: category, region, price range, minimum rating and stock.
- Explainable ranking reasons for debugging and merchant/operator inspection.
- Local-session personalization using only explicitly supplied recent/wishlist IDs.
- Merchant diversity in the result set to reduce single-seller domination.
- `/api/discovery` endpoint as the server-side integration seam.
- V162 tests covering ranking, Arabic normalization, filters, personalization and pagination.

## Production boundary

The engine is intentionally deterministic and dependency-free. For very large catalogs, the next production step is to back the same contract with PostgreSQL full-text/trigram indexes or a dedicated search provider, then blend lexical relevance with behavioral signals and semantic retrieval. No fake ML scores or fabricated inventory/offer data are introduced.
