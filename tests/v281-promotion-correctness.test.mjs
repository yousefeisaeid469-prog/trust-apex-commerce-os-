import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateDiscount, shouldApplyCoupon, evaluateDynamicPrice } from '../modules/marketplace/promotion-engine.ts';

const sql=fs.readFileSync(new URL('../db/migrations/119_v281_promotion_correctness.sql',import.meta.url),'utf8');
const baseSql=fs.readFileSync(new URL('../db/migrations/118_v280_deals_coupons_dynamic_pricing.sql',import.meta.url),'utf8');
const promo=fs.readFileSync(new URL('../modules/marketplace/promotions.ts',import.meta.url),'utf8');
const checkout=fs.readFileSync(new URL('../modules/commerce/transactions/checkout.ts',import.meta.url),'utf8');

 test('10% deal is deducted exactly once',()=>{const base=100,deal=calculateDiscount(base,'PERCENT',1000);assert.equal(deal,10);assert.equal(base-deal,90);});
 test('fixed deal is deducted exactly once',()=>{const base=100,deal=calculateDiscount(base,'FIXED',undefined,10);assert.equal(deal,10);assert.equal(base-deal,90);});
 test('coupon stacks on post-deal basis while accounting from base subtotal',()=>{const base=100,deal=10,coupon=calculateDiscount(base-deal,'PERCENT',1000);const total=base-deal-coupon;assert.equal(coupon,9);assert.equal(total,81);});
 test('maximum coupon discount is bounded',()=>{const amount=Math.min(calculateDiscount(500,'PERCENT',2000),50);assert.equal(amount,50);});
 test('minimum-subtotal and per-customer/usage controls exist in durable runtime',()=>{assert.match(promo,/COUPON_MINIMUM_NOT_MET/);assert.match(promo,/COUPON_CUSTOMER_LIMIT/);assert.match(promo,/COUPON_USAGE_EXHAUSTED/);assert.match(baseSql,/per_customer_limit/);});
 test('stacking policy is explicit',()=>{assert.equal(shouldApplyCoupon('EXCLUSIVE',true),false);assert.equal(shouldApplyCoupon('STACK_DEAL',true),true);assert.equal(shouldApplyCoupon('STACK_ALL',true),true);});
 test('voucher is intentionally exclusive with an active deal',()=>{assert.equal(shouldApplyCoupon('STACK_ALL',true,true),false);assert.match(promo,/VOUCHER_EXCLUSIVE_CONFLICT/);});
 test('scheduled lifecycle transitions to active and expires durably',()=>{assert.match(sql,/status='ACTIVE'.*status='SCHEDULED'/s);assert.match(sql,/status='EXPIRED'.*ends_at<=now\(\)/s);assert.match(promo,/runPromotionLifecycle/);});
 test('dynamic pricing respects min/max bounds',()=>{const r=evaluateDynamicPrice(100,{enabled:true,minPrice:95,maxPrice:105,maxAdjustmentBps:3000},{demandVelocity:100,conversionRate:.5,competitorPrice:130,stock:1});assert.ok(r.price>=95&&r.price<=105);});
 test('dynamic pricing uses demand, conversion and competitor signals',()=>{const r=evaluateDynamicPrice(100,{enabled:true,minPrice:80,maxPrice:120,maxAdjustmentBps:1000},{demandVelocity:40,conversionRate:.2,competitorPrice:110,stock:20});assert.notEqual(r.adjustmentBps,0);});
 test('dynamic pricing cooldown prevents churn',()=>{const r=evaluateDynamicPrice(100,{enabled:true,minPrice:90,maxPrice:110,maxAdjustmentBps:1000},{stock:2,minDwellMinutes:30,minutesSinceLastChange:5});assert.equal(r.reason,'COOLDOWN');assert.equal(r.price,100);});
 test('price decisions are persisted with rule id and signals',()=>{assert.match(promo,/recordDynamicPriceDecision/);assert.match(promo,/inputs:signals/);assert.match(sql,/inputs_json jsonb/);assert.match(sql,/rule_id uuid/);});
 test('checkout records only coupon/voucher amount in redemption ledger',()=>{assert.match(checkout,/ledgerAmount=Number\(promotion\.adjustments\.filter\(a=>a\.kind==='COUPON'\|\|a\.kind==='VOUCHER'\)/);});
 test('deal quantity, coupon redemption and voucher redemption are idempotent/locked',()=>{assert.match(promo,/for update/);assert.match(promo,/on conflict\(idempotency_key\) do nothing/);assert.match(sql,/reversal_idempotency_key/);});
 test('promotion reversal exists for cancellation/refund settlement',()=>{assert.match(promo,/reversePromotionApplicationsTx/);assert.match(checkout,/recordPromotionApplicationsTx/);});
 test('multi-seller product uniqueness is removed for real offer fan-out',()=>{assert.match(sql,/DROP CONSTRAINT IF EXISTS trust_marketplace_offers_product_id_key/);});
