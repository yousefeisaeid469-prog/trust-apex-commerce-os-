import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const offers=fs.readFileSync(new URL('../modules/marketplace/offers.ts',import.meta.url),'utf8');
const route=fs.readFileSync(new URL('../app/api/marketplace/offers/manage/route.ts',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../db/migrations/172_v339_offer_management_runtime.sql',import.meta.url),'utf8');

test('V339 offer management is durable and concurrency-safe',()=>{
  assert.match(sql,/revision integer NOT NULL DEFAULT 1/);
  assert.match(sql,/trust_marketplace_offer_change_log/);
  assert.match(offers,/OFFER_REVISION_CONFLICT/);
  assert.match(offers,/for update/);
  assert.match(offers,/where id=\$10 and merchant_id=\$11 and revision=\$12 returning/);
  assert.match(route,/OFFER_REVISION_CONFLICT/);
  assert.match(route,/getMerchantOfferHistory/);
});

test('V339 seller changes are merchant-scoped',()=>{
  assert.match(offers,/where o\.id=\$1 and o\.merchant_id=\$2 for update/);
  assert.match(route,/getMerchantByUserId/);
});
