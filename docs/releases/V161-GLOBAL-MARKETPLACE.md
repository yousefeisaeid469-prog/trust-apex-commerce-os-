# TRUST V161 — Global Marketplace Core

V161 upgrades the global commerce foundation while preserving the fail-closed trust model.

## Included
- Localized product text with deterministic locale fallback.
- ISO-4217 style three-letter currency validation and explicit FX quote objects.
- Minor-unit money arithmetic for tax and offer totals.
- Region restrictions and fulfillment modes.
- Shipping and tax line contracts ready for provider adapters.
- Explicit separation between display FX and settlement currency.
- Stronger TypeScript configuration and production control-plane typing fixes.

## Important boundary
This release does not pretend to provide every world's language, payment rail, tax regime, carrier, or live FX feed by itself. Real production coverage requires connected providers and jurisdiction-specific configuration. Unknown live data fails closed rather than being fabricated.
