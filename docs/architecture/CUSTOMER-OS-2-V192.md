# Customer OS 2.0 — V192

V192 consolidates the customer surface around existing authenticated APIs. It adds a deterministic overview, unified order/return timeline, and bounded attention priorities. The page does not invent customer data: profile, orders, returns, and cart state are loaded from existing service boundaries.

## Boundaries
- Profile: `/api/customer/profile`
- Orders: `/api/customer/orders`
- Returns: `/api/returns`
- Cart: `/api/cart`

The experience layer is pure and deterministic so the same snapshot produces the same overview and timeline. No new tracking database or fake loyalty balance is introduced.
