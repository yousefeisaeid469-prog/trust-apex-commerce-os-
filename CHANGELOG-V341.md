# TRUST V341 — Multi-Seller Cart Identity

## Real implementation
- Cart line identity is now `(product_id, offer_id)` rather than `product_id` alone.
- Customers can hold multiple seller offers for the same product in one cart.
- Added durable cart-line UUID primary key and a unique product/offer index.
- Cart normalization validates the exact selected offer, seller offer status, and offer stock.
- Cart quantity updates accept `offerId` so the correct seller line is changed.
- Cart summary reports seller/offer validity and multi-seller line count.
- Product Buy Box is propagated into the standard Add-to-Cart button.
- Existing selected-offer cart flow remains supported.

## Migration
- `db/migrations/174_v341_multiseller_cart.sql`

## Verification
- V333 payment amount authority: PASS
- V337 catalog search: PASS
- V338 discovery search: PASS
- V339 offer management: PASS (2 subtests)
- V340 order tracking: PASS
- V341 multi-seller cart: PASS

Full TypeScript/build verification is not claimed here because this working archive does not include installed project dependencies.
