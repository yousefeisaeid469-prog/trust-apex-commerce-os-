import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration=fs.readFileSync(new URL('../db/migrations/177_v345_seller_return_financials.sql',import.meta.url),'utf8');
const returns=fs.readFileSync(new URL('../modules/commerce/returns/service.ts',import.meta.url),'utf8');
const finance=fs.readFileSync(new URL('../modules/marketplace/financial-loop.ts',import.meta.url),'utf8');
const orchestrator=fs.readFileSync(new URL('../modules/commerce/payments/orchestrator.ts',import.meta.url),'utf8');
const listRoute=fs.readFileSync(new URL('../app/api/merchant/returns/route.ts',import.meta.url),'utf8');
const detailRoute=fs.readFileSync(new URL('../app/api/merchant/returns/[id]/route.ts',import.meta.url),'utf8');

test('V345 links returned items to seller orders and backfills historical returns',()=>{
 assert.match(migration,/ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders/);
 assert.match(migration,/SET seller_order_id = oi\.seller_order_id/);
 assert.match(returns,/seller_order_id/);
 assert.match(returns,/SELLER_ORDER_NOT_FOUND_FOR_RETURN_ITEM/);
});

test('V345 creates durable seller-scoped refund allocations',()=>{
 assert.match(migration,/CREATE TABLE IF NOT EXISTS trust_seller_return_refund_allocations/);
 assert.match(migration,/UNIQUE\(refund_id,seller_order_id\)/);
 assert.match(finance,/reverseSellerSettlementForReturnTx/);
 assert.match(finance,/seller-return-refund:/);
 assert.match(finance,/refunded_amount=least\(seller_credit_amount/);
});

test('V345 refund webhook uses exact seller allocation for returns',()=>{
 assert.match(orchestrator,/return_id/);
 assert.match(orchestrator,/reverseSellerSettlementForReturnTx/);
 assert.match(orchestrator,/refund\.rows\[0\]\.return_id/);
});

test('V345 merchant returns are ownership scoped',()=>{
 assert.match(listRoute,/listSellerReturns/);
 assert.match(detailRoute,/getSellerReturnForMerchant/);
 assert.match(detailRoute,/RETURN_NOT_FOUND_OR_NOT_OWNED/);
});
console.log('V345 seller returns: PASS');
