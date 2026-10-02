# TRUST V276 — Customer Intelligence & Organic Personalization

V276 adds a privacy-minimal customer preference layer to marketplace discovery.

## Production surface
- Anonymous first-party marketplace session cookie with a one-way SHA-256 session digest in PostgreSQL.
- Product-view events build category affinity and a rolling price center.
- Organic search ranking receives bounded personalization boosts only after observed marketplace views.
- Cold-start users retain the canonical relevance/rating/availability ranking.
- Sponsored inventory is explicitly excluded from the organic personalization score.
- Search and preference APIs are durable PostgreSQL-backed runtime paths.

## Data boundary
No raw search query is persisted by the personalization layer, no third-party tracking identifier is used, and no identity is required for the profile.

## Verification
- Targeted V276 tests: 3/3 PASS.
- Migration sequence: 114 canonical migrations expected.
- Next.js/TypeScript production build is not claimed when dependencies are unavailable.
