# Marketplace Intelligence — V206

V206 centralizes marketplace ranking signals without copying proprietary marketplace internals. The engine consumes the current catalog and produces deterministic, explainable ranked offers.

## Ranking model

Signals are bounded and separated:
- relevance: normalized Arabic/Unicode-aware token matching with bounded edit distance;
- trust: rating-derived quality signal;
- availability: stock-derived availability signal;
- value: declared discount and budget fit;
- preferences: explicit tag matches.

Merchant diversification is applied after scoring so one merchant cannot dominate a result set when comparable alternatives exist.

## Monetization boundary

The engine may identify monetization opportunities, but it does not execute financial actions. Sponsored inventory must remain disclosed and separately governed. Affiliate and subscription systems remain adapter/policy concerns.

## Data honesty

V206 does not infer demand from low stock, does not invent delivery promises, and does not claim an offer is a deal unless a previous declared price exists and exceeds the current price.

## API

`GET /api/marketplace-intelligence` reads the current catalog and accepts query/filter parameters.

`POST /api/recommendations` now uses the same intelligence engine and returns catalog-backed recommendations with disclosure metadata.
