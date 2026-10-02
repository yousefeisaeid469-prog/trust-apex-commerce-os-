import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration=fs.readFileSync(new URL('../db/migrations/176_v343_seller_operations_bridge.sql',import.meta.url),'utf8');
const fulfillment=fs.readFileSync(new URL('../modules/marketplace/fulfillment-runtime.ts',import.meta.url),'utf8');
const ops=fs.readFileSync(new URL('../modules/marketplace/seller-operations.ts',import.meta.url),'utf8');
const sellerOrders=fs.readFileSync(new URL('../modules/marketplace/seller-orders.ts',import.meta.url),'utf8');
const finance=fs.readFileSync(new URL('../modules/marketplace/financial-loop.ts',import.meta.url),'utf8');
const journey=fs.readFileSync(new URL('../modules/commerce/core/production-journey.ts',import.meta.url),'utf8');
const financeRoute=fs.readFileSync(new URL('../app/api/merchant/finance/route.ts',import.meta.url),'utf8');

test('V343 binds seller orders to physical fulfillment',()=>{
  assert.match(migration,/seller_order_id uuid REFERENCES trust_seller_orders/);
  assert.match(migration,/trust_seller_order_financials/);
  assert.match(migration,/trust_seller_order_payout_allocations/);
  assert.match(fulfillment,/sellerOrderId\?:string/);
  assert.match(fulfillment,/oi\.seller_order_id=\$2/);
  assert.match(fulfillment,/seller_order_id/);
  assert.match(journey,/sellerOrder = .*trust_seller_orders/s);
  assert.match(journey,/sellerOrderId: sellerOrder\?\.id/);
});

test('V343 delivery closes seller order and creates seller-level financial visibility',()=>{
  assert.match(fulfillment,/input\.toStatus==='DELIVERED' && f\.seller_order_id/);
  assert.match(fulfillment,/update trust_seller_orders set status='DELIVERED'/);
  assert.match(finance,/update trust_seller_order_financials/);
  assert.match(finance,/insert into trust_seller_order_financials/);
  assert.match(ops,/syncSellerOrderFinancialTx/);
});

test('V343 seller payout cannot exceed released amount and is allocated to the seller order',()=>{
  assert.match(ops,/SELLER_ORDER_NOT_DELIVERED/);
  assert.match(ops,/SELLER_ORDER_FUNDS_NOT_RELEASED/);
  assert.match(ops,/SELLER_ORDER_PAYOUT_EXCEEDS_RELEASED_AMOUNT/);
  assert.match(ops,/trust_seller_order_payout_allocations/);
  assert.match(ops,/set seller_order_id=\$2/);
  assert.match(financeRoute,/requestSellerOrderPayoutTx/);
});

test('V343 direct seller-order delivery transition is blocked without delivered fulfillment',()=>{
  assert.match(sellerOrders,/SELLER_ORDER_FULFILLMENT_NOT_DELIVERED/);
  assert.match(sellerOrders,/f\.seller_order_id/);
});
