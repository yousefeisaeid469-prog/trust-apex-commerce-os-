# TRUST V297 — Global Commerce Runtime

V297 turns the V296 global-commerce foundation into a deterministic runtime boundary.

## Scope
- 25 country capability profiles with locale, settlement-currency, payment and shipping constraints.
- Integer minor-unit money arithmetic using `bigint`.
- Rational FX quotes with expiry/future-time validation and explicit target matching.
- Tax calculation supporting exclusive and included-in-price rules.
- Provider-neutral payment adapter descriptors with explicit sandbox/production environment boundaries.
- Shipping capability and price resolution.
- Runtime quote API and country-capability API.
- Migration 135 for operational currency, adapter, shipping-zone and locale registries.

## Non-claims
V297 does not certify tax compliance, payment-provider certification, shipping-provider SLAs, or live production infrastructure. Provider credentials and legal/tax configuration remain deployment responsibilities.
