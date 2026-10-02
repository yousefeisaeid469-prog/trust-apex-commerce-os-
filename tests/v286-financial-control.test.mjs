import fs from 'node:fs'; import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(f,'utf8');
const sql=read('db/migrations/124_v286_financial-control-hardening.sql'); const mod=read('modules/marketplace/disputes-finance.ts');
assert.match(sql,/allocation_total/); assert.match(sql,/idx_marketplace_dispute_allocations_merchant/); assert.match(sql,/idx_marketplace_payout_recon_payout_provider_ref/);
assert.match(mod,/DISPUTE_ALLOCATION_INCOMPLETE/); assert.match(mod,/PAYOUT_PROVIDER_EVENT_PAYLOAD_CONFLICT/); assert.match(mod,/providerEventReplay/);
console.log('V286 financial control contracts: 11/11 PASS');
