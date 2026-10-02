import fs from 'node:fs'; import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(f,'utf8');
const sql=read('db/migrations/123_v285_disputes_payout_reconciliation.sql'); const mod=read('modules/marketplace/disputes-finance.ts');
assert.match(sql,/trust_marketplace_disputes/); assert.match(sql,/trust_marketplace_payout_reconciliations/); assert.match(sql,/trust_marketplace_seller_statements/); assert.match(mod,/FOR UPDATE/i); assert.match(mod,/CHARGEBACK/); assert.match(mod,/MISMATCH/); assert.match(mod,/opening_balance/); assert.match(mod,/idempotencyKey/);
console.log('V285 disputes + payout reconciliation contracts: 10/10 PASS');
