import assert from 'node:assert/strict'; import fs from 'node:fs';
const migration=fs.readFileSync('db/migrations/175_v342_seller_order_split.sql','utf8');
const runtime=fs.readFileSync('modules/marketplace/seller-orders.ts','utf8');
const checkout=fs.readFileSync('modules/commerce/transactions/checkout.ts','utf8');
const globalCheckout=fs.readFileSync('modules/commerce/transactions/global-checkout.ts','utf8');
assert.match(migration,/CREATE TABLE IF NOT EXISTS trust_seller_orders/); assert.match(migration,/UNIQUE\(order_id, merchant_id\)/); assert.match(migration,/ADD COLUMN IF NOT EXISTS seller_order_id/);
assert.match(runtime,/createSellerOrdersTx/); assert.match(runtime,/SELLER_ORDER_NOT_FOUND/); assert.match(runtime,/INVALID_SELLER_ORDER_TRANSITION/); assert.match(runtime,/trust_seller_order_events/);
assert.match(checkout,/createSellerOrdersTx/); assert.match(checkout,/seller_order_id/); assert.match(globalCheckout,/createSellerOrdersTx/); assert.match(globalCheckout,/seller_order_id/);
console.log('V342 seller order split: PASS');
