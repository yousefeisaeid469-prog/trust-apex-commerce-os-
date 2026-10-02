import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateShipments } from '../modules/marketplace/checkout-plan.ts';

test('consolidates compatible network items into one shipment and charges route once',()=>{
  const shipments=allocateShipments([
    {productId:'p1',qty:1,offerId:'o1',unitPrice:100,sellerId:'m1',locationId:'l1',destinationRegion:'Cairo',minDays:1,maxDays:3,shippingCost:40,fulfillmentCost:5,source:'NETWORK'},
    {productId:'p2',qty:2,offerId:'o2',unitPrice:80,sellerId:'m1',locationId:'l1',destinationRegion:'Cairo',minDays:2,maxDays:4,shippingCost:35,fulfillmentCost:4,source:'NETWORK'},
    {productId:'p3',qty:1,offerId:'o3',unitPrice:60,sellerId:'m2',locationId:'l2',destinationRegion:'Cairo',minDays:1,maxDays:2,shippingCost:25,fulfillmentCost:3,source:'NETWORK'}
  ]);
  assert.equal(shipments.length,2);
  assert.equal(shipments[0].locationId,'l2');
  const consolidated=shipments.find(x=>x.locationId==='l1');
  assert.equal(consolidated.itemCount,3);
  assert.equal(consolidated.shippingCost,40);
  assert.equal(consolidated.fulfillmentCost,13);
  assert.equal(consolidated.totalCost,53);
});

test('fallback offers remain split and never invent a fulfillment location',()=>{
  const shipments=allocateShipments([
    {productId:'p1',qty:1,offerId:'o1',unitPrice:100,sellerId:'m1',destinationRegion:'GLOBAL',minDays:3,maxDays:6,shippingCost:20,fulfillmentCost:0,source:'OFFER_FALLBACK'},
    {productId:'p2',qty:1,offerId:'o2',unitPrice:100,sellerId:'m1',destinationRegion:'GLOBAL',minDays:2,maxDays:5,shippingCost:15,fulfillmentCost:0,source:'OFFER_FALLBACK'}
  ]);
  assert.equal(shipments.length,2);
  assert.equal(shipments.every(x=>x.locationId===undefined),true);
});

test('same input produces deterministic shipment ordering',()=>{
  const input=[
    {productId:'p1',qty:1,offerId:'o1',unitPrice:1,sellerId:'m1',locationId:'b',destinationRegion:'x',minDays:2,maxDays:4,shippingCost:10,fulfillmentCost:1,source:'NETWORK'},
    {productId:'p2',qty:1,offerId:'o2',unitPrice:1,sellerId:'m1',locationId:'a',destinationRegion:'x',minDays:2,maxDays:4,shippingCost:10,fulfillmentCost:1,source:'NETWORK'}
  ];
  assert.deepEqual(allocateShipments(input).map(x=>x.locationId),['a','b']);
});

test('checkout commit route binds the server-selected offer and fulfillment plan', async()=>{
  const route=await (await import('node:fs/promises')).readFile(new URL('../app/api/checkout/commit/route.ts',import.meta.url),'utf8');
  assert.match(route,/planMarketplaceCheckout/);
  assert.match(route,/const boundLines = fulfillmentPlan\.items\.map/);
  assert.match(route,/fulfillmentPlan,/);
});

test('V274 migration persists fulfillment location on reservations and order shipments', async()=>{
  const sql=await (await import('node:fs/promises')).readFile(new URL('../db/migrations/112_v274_intelligent_checkout.sql',import.meta.url),'utf8');
  assert.match(sql,/ADD COLUMN IF NOT EXISTS offer_id/);
  assert.match(sql,/ADD COLUMN IF NOT EXISTS location_id/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS trust_order_shipments/);
});
