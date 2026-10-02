import test from 'node:test';
import assert from 'node:assert/strict';
import {recordPrice,priceStats,shouldTriggerPriceAlert,createInterest,helpMeDecide} from '../modules/platform/shopping-intelligence/index.ts';

test('V163 keeps chronological price history and computes min/max',()=>{const h=recordPrice([], {at:'2026-01-02T00:00:00Z',amountMinor:1200n,currency:'EGP'});const h2=recordPrice(h,{at:'2026-01-01T00:00:00Z',amountMinor:1000n,currency:'EGP'});const s=priceStats(h2);assert.equal(s.min,1000n);assert.equal(s.max,1200n);assert.equal(s.current.amountMinor,1200n);});
test('V163 price alerts are explicit and currency-safe',()=>{const a={id:'a',productId:'p',targetMinor:900n,currency:'EGP',active:true};assert.equal(shouldTriggerPriceAlert(a,850n,'EGP'),true);assert.equal(shouldTriggerPriceAlert(a,850n,'USD'),false);});
test('V163 interests validate input',()=>{const i=createInterest('black oversized hoodie');assert.equal(i.active,true);assert.throws(()=>createInterest('x'),/INVALID_INTEREST/);});
test('V163 Help Me Decide returns one explainable winner',()=>{const r=helpMeDecide([{id:'a',title:'A',priceMinor:1000n,currency:'EGP',rating:4.2,deliveryDays:5,stock:5,features:[]},{id:'b',title:'B',priceMinor:1200n,currency:'EGP',rating:4.9,deliveryDays:1,stock:20,features:[]}]);assert.equal(r?.winnerId,'b');assert.ok(r?.reasons.includes('high rating'));});
test('V163 Help Me Decide fails closed when nothing is buyable',()=>{assert.equal(helpMeDecide([{id:'a',title:'A',priceMinor:1n,currency:'EGP',rating:5,deliveryDays:1,stock:0,features:[]}]),null);});
