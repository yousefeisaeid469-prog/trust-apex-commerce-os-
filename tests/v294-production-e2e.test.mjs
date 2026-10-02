import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('db/migrations/132_v294_production_e2e_evidence.sql','utf8');
const runner = fs.readFileSync('scripts/production_e2e.mjs','utf8');
const evidence = fs.readFileSync('modules/platform/production-e2e-evidence.ts','utf8');

for (const table of ['trust_production_e2e_runs','trust_production_e2e_steps']) assert.match(migration,new RegExp(`create table if not exists ${table}`));
for (const key of ['DATABASE_URL','E2E_APP_BASE_URL','E2E_PAYMENT_PROVIDER','E2E_PAYMENT_PROVIDER_BASE_URL','TRUST_PAYMENT_WEBHOOK_SECRET']) assert.match(runner,new RegExp(key));
for (const step of ['SELLER_REGISTERED','STORE_CREATED','PRODUCT_CREATED','BUYER_REGISTERED','CART_UPDATED','CHECKOUT_QUOTED','CHECKOUT_COMMITTED','PAYMENT_INTENT_CREATED','PAYMENT_WEBHOOK','FULFILLMENT_SHIPMENT_CREATED','DELIVERY_SIMULATED','SELLER_BALANCE_CHECK','PAYOUT_REQUESTED','PAYOUT_PAID','RECONCILIATION']) assert.match(runner,new RegExp(`['"]${step}['"]`));
assert.match(runner,/HMAC|createHmac/);
assert.match(runner,/api\/payments\/webhook/);
assert.match(runner,/replay/);
assert.match(evidence,/startProductionE2ERun/);
assert.match(evidence,/recordProductionE2EStep/);
assert.match(evidence,/finishProductionE2ERun/);
console.log('V294 production E2E evidence contract PASS');
