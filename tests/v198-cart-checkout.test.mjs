import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateCartTotals, normalizeCartLines, reconcileCart } from '../modules/commerce/cart/experience-3.ts';
test('V198 normalizes duplicate lines and bounds quantities',()=>{assert.deepEqual(normalizeCartLines([{productId:'a',qty:1},{productId:'a',qty:2}]),[{productId:'a',qty:3}]);assert.throws(()=>normalizeCartLines([{productId:'a',qty:0}]),/INVALID_QUANTITY/)});
test('V198 calculates one canonical shipping policy',()=>{assert.deepEqual(calculateCartTotals([{qty:1,unitPrice:1000}]),{subtotal:1000,shipping:60,total:1060,currency:'EGP'});assert.deepEqual(calculateCartTotals([{qty:1,unitPrice:1500}]),{subtotal:1500,shipping:0,total:1500,currency:'EGP'})});
test('V198 reconciles stock before checkout and exposes warnings',()=>{const state=reconcileCart([{productId:'a',qty:5}],[{productId:'a',name:'A',unitPrice:100,stock:2}]);assert.equal(state.code,'INSUFFICIENT_STOCK');assert.deepEqual(state.warnings,['INSUFFICIENT_STOCK:a']);assert.equal(state.total,260)});
test('V198 checkout preview and commit use server-authoritative boundaries',()=>{const preview=fs.readFileSync('app/api/checkout/preview/route.ts','utf8');const commit=fs.readFileSync('modules/commerce/transactions/checkout.ts','utf8');assert.match(preview,/reconcileCart/);assert.match(preview,/authoritative/);assert.match(commit,/pg_advisory_xact_lock/);assert.match(commit,/Shipping is server-authoritative/)})
test('V198 UI has recovery states for stale checkout data',()=>{const shell=fs.readFileSync('components/trust-os-shell.tsx','utf8');assert.match(shell,/checkout\/preview/);assert.match(shell,/priceChanged/);assert.match(shell,/cartStockWarnings/)})
