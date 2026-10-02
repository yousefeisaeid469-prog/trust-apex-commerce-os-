import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const promo=readFileSync(new URL('../modules/marketplace/promotions.ts',import.meta.url),'utf8');
const pricing=readFileSync(new URL('../modules/commerce/pricing/engine.ts',import.meta.url),'utf8');
const checkout=readFileSync(new URL('../modules/commerce/transactions/checkout.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../db/migrations/118_v280_deals_coupons_dynamic_pricing.sql',import.meta.url),'utf8');
const route=readFileSync(new URL('../app/api/marketplace/promotions/route.ts',import.meta.url),'utf8');

test('V280 durable promotion surfaces exist and are bounded',()=>{assert.match(migration,/trust_marketplace_deals/);assert.match(migration,/trust_marketplace_coupons/);assert.match(migration,/trust_marketplace_vouchers/);assert.match(migration,/trust_marketplace_price_history/);assert.match(migration,/trust_marketplace_dynamic_price_rules/);assert.match(promo,/applyBoundedDynamicPrice/);assert.match(promo,/quantity_limit/);assert.match(promo,/eligibleSubtotal/);assert.match(promo,/row\.offer_id/)});
test('V280 pricing is server-authoritative and checkout-bound',()=>{assert.match(pricing,/quoteMarketplacePromotions/);assert.match(checkout,/quoteMarketplacePromotions/);assert.match(checkout,/commitPromotionTx/);assert.match(checkout,/claimDealQuantityTx/);assert.match(checkout,/QUOTE_PRICE_CHANGED/)});
test('V280 seller promotion API and customer deals surface are present',()=>{assert.match(route,/createDeal/);assert.match(route,/createCoupon/);assert.match(route,/OFFER_NOT_OWNED/);assert.match(readFileSync(new URL('../app/deals/page.tsx',import.meta.url),'utf8'),/api\/marketplace\/promotions/)});
