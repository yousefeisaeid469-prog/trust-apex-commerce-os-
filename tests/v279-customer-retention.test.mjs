import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const moduleText=readFileSync(new URL('../modules/marketplace/customer-retention.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../db/migrations/117_v279_customer_retention_trust.sql',import.meta.url),'utf8');
const product=readFileSync(new URL('../app/product/[id]/page.tsx',import.meta.url),'utf8');

test('V279 reviews use verified purchase evidence and helpful votes',()=>{assert.match(moduleText,/verified_purchase/);assert.match(moduleText,/trust_order_items/);assert.match(moduleText,/trust_review_helpful_votes/);assert.match(migration,/trust_reviews_status_check/)});
test('V279 wishlist and price alerts are customer scoped',()=>{assert.match(moduleText,/trust_marketplace_wishlists/);assert.match(moduleText,/trust_marketplace_price_alerts/);assert.match(migration,/UNIQUE\(customer_id,product_id\)/);assert.match(product,/CustomerProductActions/)});
test('V279 loyalty awards are durable and idempotent',()=>{assert.match(moduleText,/awardLoyaltyPoints/);assert.match(moduleText,/idempotency_key/);assert.match(migration,/trust_marketplace_loyalty_ledger/)});
