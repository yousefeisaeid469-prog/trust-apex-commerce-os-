import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate,workflowId,STAGES} from '../modules/platform/v317/marketplace/engine.ts';
const c={tenantId:'t',sellerId:'s',productId:'p',offerId:'o',customerId:'u',quantity:2,unitPriceMinor:12500n,shippingMinor:1500n,currency:'EGP',commissionBps:2000,idempotencyKey:'idem',destinationRegion:'EG'};
const x=calculate(c); assert.deepEqual(x,{subtotalMinor:25000n,shippingMinor:1500n,totalMinor:26500n,commissionMinor:5000n,fulfillmentFeeMinor:1500n,sellerNetMinor:20000n});
assert.equal(STAGES.length,9); assert.match(workflowId(c),/^v317_[a-f0-9]{32}$/); assert.equal(workflowId(c),workflowId({...c}));
assert.throws(()=>calculate({...c,quantity:0}),/V317_QUANTITY_INVALID/); assert.throws(()=>calculate({...c,currency:'EG'}),/V317_CURRENCY_INVALID/); assert.throws(()=>calculate({...c,commissionBps:10001}),/V317_COMMISSION_INVALID/); assert.throws(()=>calculate(c,1n),/V317_SETTLEMENT_IMBALANCE/);
const sql=fs.readFileSync('db/migrations/155_v317_transactional_marketplace_execution.sql','utf8'); for(const t of ['trust_v317_marketplace_executions','trust_v317_marketplace_events']) assert.match(sql,new RegExp(`CREATE TABLE IF NOT EXISTS ${t}`));
console.log('V317 transactional Marketplace OS tests PASS');
