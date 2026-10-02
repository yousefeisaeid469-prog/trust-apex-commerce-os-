# TRUST V194 — AI Experience 2.0

V194 unifies the existing shopping concierge, explainable intelligence, customer/merchant context boundaries, and global navigation into a single AI Experience surface.

## Boundaries

- Decision support only; payment, refund, fulfillment, and other sensitive execution remain behind existing approval/execution boundaries.
- No live provider availability, live price, or live inventory is invented by this layer.
- Existing `runShoppingConcierge` is reused for shopping recommendations.
- AI signals expose their source and confidence.
- The API is dynamic and `no-store` because inputs are user/context dependent.
