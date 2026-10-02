import assert from 'node:assert/strict';
import {calculateFinalPrice} from '../modules/marketplace/economic-core.ts';
import {calculateFee, sellerNet} from '../modules/marketplace/fee-engine.ts';

// Pure economic invariants: checkout total is derived from one discount ledger, never twice.
assert.equal(calculateFinalPrice({base:100,seller:0,dynamic:0,deal:10,coupon:5,voucher:0,quantity:0,membership:0,b2b:0,regional:0,tax:0,shipping:0}),85);
assert.equal(calculateFinalPrice({base:100,seller:0,dynamic:0,deal:0,coupon:0,voucher:10,quantity:0,membership:0,b2b:0,regional:0,tax:0,shipping:20}),110);
assert.equal(calculateFee({baseAmount:1000,rateBps:1000}),100);
assert.equal(calculateFee({baseAmount:1000,rateBps:1000,minimumFee:150}),150);
assert.equal(calculateFee({baseAmount:1000,rateBps:1000,maximumFee:80}),80);
assert.equal(sellerNet(1000,120),880);
// Split invariant: gross = seller + all assessed fee classes.
const gross=1000, fees={platform:100,payment:20,fulfillment:30,ret:10};
assert.equal(sellerNet(gross,Object.values(fees).reduce((a,b)=>a+b,0)),840);
console.log('V283 economic settlement invariants: 7/7 PASS');
