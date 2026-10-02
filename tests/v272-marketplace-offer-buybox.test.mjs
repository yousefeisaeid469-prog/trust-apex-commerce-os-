import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root=process.cwd();

test('V272 offer graph migration creates canonical items, offers and buy-box snapshots',()=>{
  const m=fs.readFileSync('db/migrations/109_v272_marketplace_offer_buybox.sql','utf8');
  assert.match(m,/trust_marketplace_catalog_items/); assert.match(m,/trust_marketplace_offers/); assert.match(m,/trust_marketplace_buybox_snapshots/); assert.match(m,/UNIQUE\(catalog_item_id, merchant_id\)/);
});

test('V272 selected offers are durably bound through cart and order lines',()=>{
  const cart=fs.readFileSync('modules/commerce/cart/store.ts','utf8');
  const price=fs.readFileSync('modules/commerce/pricing/engine.ts','utf8');
  const checkout=fs.readFileSync('modules/commerce/transactions/checkout.ts','utf8');
  assert.match(cart,/offer_id/); assert.match(price,/OFFER_NOT_AVAILABLE/); assert.match(checkout,/INSUFFICIENT_OFFER_STOCK/); assert.match(checkout,/insert into trust_order_items[\s\S]*offer_id/);
});

test('V272 Buy Box is deterministic and favors a strong total-value offer',async()=>{
  const {readFileSync}=fs;
  const source=readFileSync('modules/marketplace/offers.ts','utf8');
  assert.match(source,/priceScore\*\.32/); assert.match(source,/sellerScore\*\.24/); assert.match(source,/fulfillmentScore\*\.18/); assert.match(source,/deliveryScore\*\.14/); assert.match(source,/availability\*\.08/); assert.match(source,/returns\*\.04/);
  assert.match(source,/sort\(\(a,b\)=>b\.score-a\.score/);
});

test('V272 customer surface exposes competing offers',()=>{
  assert.ok(fs.existsSync('components/offer-selector.tsx'));
  assert.match(fs.readFileSync('app/product/[id]/page.tsx','utf8'),/OfferSelector/);
  assert.ok(fs.existsSync('app/api/marketplace/offers/route.ts'));
});
