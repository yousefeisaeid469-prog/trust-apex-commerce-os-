# TRUST V277 — Customer Shopping Missions + Smart Bundles

V277 adds a real customer decision surface on top of V276 personalization: durable shopping missions and explainable complementary bundle recommendations.

## Runtime
- `modules/marketplace/smart-bundles.ts`
- `POST /api/marketplace/missions`
- `GET /api/marketplace/missions?id=...`
- `POST /api/marketplace/bundles`
- `/shop/mission`

## Data
Migration `115_v277_shopping_missions_smart_bundles.sql` adds durable missions, merchant-defined bundle templates/items, and recommendation snapshots.

## Design boundaries
Recommendations are deterministic and explainable. They use product category/tags, rating, stock, budget fit, and the existing Buy Box offer. No fabricated semantic model or opaque external tracker is introduced.
