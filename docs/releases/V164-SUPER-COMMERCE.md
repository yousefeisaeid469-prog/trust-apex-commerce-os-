# TRUST V164 — Super-Commerce

V164 adds a deterministic commerce intelligence layer on top of the V163 marketplace primitives.

## Included
- Cart merge and quantity management.
- Transparent coupon validation and bounded discounts.
- Tier-aware loyalty points earn/redeem flows.
- Time-windowed deal selection with stock/currency checks.
- Review insight extraction with verified-purchase ratio.
- Seller trust scoring from observable operational metrics.
- Buy-again filtering against currently available offers.
- Smart bundles with explicit subtotal, discount and total.

## Design principles
- No fabricated payment, FX, shipping, tax or inventory providers.
- Money stays in integer minor units.
- Eligibility is validated before discounts or deals are applied.
- Outputs remain explainable so production policy can audit why an outcome occurred.

## Next integration targets
- Postgres persistence for carts, coupons, loyalty ledgers and review aggregates.
- Real payment and tax providers per market.
- Event-driven recommendation graph and customer preference controls.
- Search/AI adapters for conversational and visual shopping.
