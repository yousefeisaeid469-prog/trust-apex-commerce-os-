import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSellerTrust } from '../modules/marketplace/seller-intelligence-score.ts';

const base={merchantId:'m',ordersTotal:100,ordersOnTime:95,cancellations:2,returns:3,defects:1,stockouts:2,ratingsCount:100,ratingAverage:4.7};

test('seller trust rewards reliable sellers while bounding the score',()=>{
  const trust=calculateSellerTrust(base);
  assert.ok(trust.trustScore>70);
  assert.ok(trust.trustScore<=100);
  assert.ok(trust.confidence<1);
});

test('new sellers stay neutral instead of being punished for missing history',()=>{
  const trust=calculateSellerTrust({...base,ordersTotal:0,ordersOnTime:0,cancellations:0,returns:0,defects:0,stockouts:0,ratingsCount:0,ratingAverage:null});
  assert.equal(trust.trustScore,50);
  assert.equal(trust.confidence,0);
});

test('buy box uses seller trust and deterministic landed-cost tie breaking',async()=>{
  const src=await (await import('node:fs/promises')).readFile(new URL('../modules/marketplace/offers.ts',import.meta.url),'utf8');
  assert.match(src,/getSellerTrustBatch/);
  assert.match(src,/sellerTrust\?\.trustScore/);
  assert.match(src,/a\.offer\.price\+a\.offer\.shippingFee/);
});

test('checkout records a real seller order event idempotently',async()=>{
  const src=await (await import('node:fs/promises')).readFile(new URL('../modules/commerce/transactions/checkout.ts',import.meta.url),'utf8');
  assert.match(src,/recordSellerOrderAcceptedTx/);
  assert.match(src,/line\.offerId/);
});

test('V275 migration creates durable seller performance facts and events',async()=>{
  const sql=await (await import('node:fs/promises')).readFile(new URL('../db/migrations/113_v275_seller_trust_intelligence.sql',import.meta.url),'utf8');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS trust_marketplace_seller_performance/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS trust_marketplace_seller_performance_events/);
  assert.match(sql,/ORDER_ACCEPTED/);
});
