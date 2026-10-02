import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOffer,computeTaxes,convertMoney,translate} from '../modules/platform/global-marketplace/index.ts';

test('V161 localizes with locale and safe fallbacks',()=>assert.equal(translate({ar:'منتج',en:'Product'},'fr-FR'),'Product'));
test('V161 computes exact minor-unit tax lines',()=>assert.equal(computeTaxes({amountMinor:10000n,currency:'EGP'},[{jurisdiction:'EG',rate:.14}])[0].amountMinor,1400n));
test('V161 converts only with an explicit FX quote',()=>assert.deepEqual(convertMoney({amountMinor:1000n,currency:'USD'},{base:'USD',quote:'EUR',rate:.9,asOf:'2026-09-04T00:00:00Z',provider:'test',expiresAt:'2026-09-04T01:00:00Z'}),{amountMinor:900n,currency:'EUR'}));
test('V161 refuses a region-restricted product',()=>assert.throws(()=>buildOffer({id:'p',merchantId:'m',title:{en:'x'},categoryId:'c',sku:'s',priceMinor:100n,currency:'USD',inventory:2,active:true,regionAllowlist:['US']},{country:'EG',defaultCurrency:'EGP',defaultLocale:'ar-EG',supportedCurrencies:['EGP'],supportedFulfillment:['STANDARD']}),/REGION_RESTRICTED/));
test('V161 builds a real settlement offer in one currency',()=>assert.equal(buildOffer({id:'p',merchantId:'m',title:{en:'x'},categoryId:'c',sku:'s',priceMinor:10000n,currency:'EGP',inventory:2,active:true},{country:'EG',defaultCurrency:'EGP',defaultLocale:'ar-EG',supportedCurrencies:['EGP'],supportedFulfillment:['STANDARD']},{carrier:'TRUST',service:'standard',amount:{amountMinor:500n,currency:'EGP'},etaDays:3,mode:'STANDARD'},[{jurisdiction:'EG',rate:.14,amountMinor:1400n}]).total.amountMinor,11900n));
