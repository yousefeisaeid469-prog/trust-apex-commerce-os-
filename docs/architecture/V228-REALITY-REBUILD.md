# V228 Reality Rebuild — Completion Pass

## Runtime truth protocol

Every data-backed surface must distinguish:

- `LIVE` — authoritative runtime data is being read from the configured source.
- `FOUNDATION` — the contract/control-plane exists, but the production capability is not complete.
- `SIMULATION` — deterministic planning/demo behavior with no production side effect.
- `PROVIDER_REQUIRED` — the internal boundary exists, but a real external provider is required.
- `DEGRADED` — data exists, but evidence is insufficient to claim live state.
- `ERROR` — the request failed.

A successful HTTP response is never sufficient to label a surface `LIVE`.

## Completion pass

This pass added database-backed runtime implementations for:

- `/api/deals` — derives active deals from `trust_products.old_price`.
- `/api/brands` — derives brands from `trust_merchant_profiles` and active catalog counts.
- `/api/compare` — reads authoritative product rows and supports GET/POST comparison requests.
- `/api/price-alerts` — authenticated read/write flow backed by `trust_price_watch`.

Simulation-only POST surfaces that do not persist production state now explicitly identify themselves as `SIMULATION` and `productionMutation:false` where applicable.

Foundation-only mutations remain HTTP `501 NOT_IMPLEMENTED`; no arbitrary request body is presented as a successful side effect.

## Catalog source of truth

`modules/commerce/repository/catalog.ts` is the authoritative runtime catalog repository and reads `trust_products`.

`fixtures/catalog.ts` contains demo data. `modules/commerce/products/catalog.ts` remains a deprecated compatibility bridge for legacy in-memory modules and must not be used by new production code.

## Domain UI rule

High-value domains have domain-specific UI components rather than raw JSON rendering:

- Orders
- Agents
- Reliability
- Decision Center / Decision Fabric
- AI Quality
- Revenue Intelligence
- Merchant Supergraph
- Payments

The remaining generic surfaces are intentionally a compatibility layer. The next UI pass should migrate them by business domain, not by creating more generic JSON renderers.

## Verification

- `npm test`: **472/472 PASS**.
- `npm run migration-check`: **PASS** — 78 canonical migrations.
- `npm run release-gate`: **PASS**.
- `npm run contract-check`: **PASS**.
- `npm run architecture-fitness`: **PASS**.
- `npm run api-docs-check`: **PASS**.
- `npm run secret-scan-v222`: **PASS**.
- Query-scale audit reports no production `SELECT *` patterns.

The remaining production verification blocker is dependency installation in the current offline execution environment. The committed `package-lock.json` is only a root-level lock and cannot satisfy `npm ci` without registry access. Therefore this archive deliberately does **not** claim `next build` or `tsc --noEmit` as verified.

## External provider boundary

Payments, shipping, messaging, vision and other external integrations retain provider-neutral adapters. A real provider must be configured and exercised before a surface can move from `PROVIDER_REQUIRED` to `LIVE`. No fake provider success is introduced merely to make the build appear complete.
