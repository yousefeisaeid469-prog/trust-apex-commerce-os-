# TRUST V65 Modular Architecture

TRUST is organized into business capabilities. Each module is designed to keep UI, domain logic, API contracts, types, and tests close together as the system grows.

## Modules
- commerce: products, inventory, cart, orders, checkout
- marketplace: discovery and marketplace orchestration
- merchants: merchant operations and onboarding
- customers: customer profiles and lifecycle
- trust: merchant score, fraud shield, audit
- ai: pricing, stylist, fit, forecasting, voice
- advertising: merchant ads, sponsored products, native ads
- social: shared cart, style battles, referrals
- supply-chain: sourcing, suppliers, restock
- analytics: behavioral and business intelligence
- monetization: subscriptions, commissions, visitor monetization

## Rule
A module should expose a small public surface and avoid importing UI code from unrelated modules. Integrations belong in `lib/` or explicit module adapters.
