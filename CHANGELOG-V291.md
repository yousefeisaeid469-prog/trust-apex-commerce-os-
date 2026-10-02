# TRUST V291 — Product E2E

V291 turns the existing buyer/seller/catalog/cart/checkout/payment/fulfillment surfaces into one explicit product journey.

## Product flow
Seller registration → store → product → buyer registration → cart → cart-backed quote/checkout → order → payment intent/webhook → fulfillment → delivery → seller balance.

## Runtime changes
- Added `POST /api/checkout/cart/commit` as a cart-native checkout entry point.
- Cart checkout rejects stale/invalid cart state and uses server-authoritative quote pricing.
- Cart is cleared only when its contents still match the snapshot used for checkout.
- Added durable product-journey checkpoints for production evidence.
- Preserved existing payment, refund, dispute, payout, fulfillment and dashboard APIs.

## Evidence boundary
This release adds product wiring and contract coverage. It does not claim external payment-provider certification, global tax compliance, or a full live-DB E2E certification without a configured production-like database/provider environment.
