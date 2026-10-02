import fs from 'node:fs';
import assert from 'node:assert/strict';
const migration=fs.readFileSync(new URL('../db/migrations/161_v323_financial_close.sql',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../modules/platform/v323/financial-close.ts',import.meta.url),'utf8');
const payout=fs.readFileSync(new URL('../app/api/finance/payout-events/route.ts',import.meta.url),'utf8');
for(const t of ['trust_financial_close_runs','trust_financial_close_items']) assert.match(migration,new RegExp(`CREATE TABLE IF NOT EXISTS ${t}`));
for(const token of ['runFinancialClose','applyPayoutProviderEvent','settlement','refund','payout','idempotency','withPgTransaction','for update']) assert.match(service,new RegExp(token,'i'));
assert.match(payout,/applyPayoutProviderEvent/);
console.log('V323 financial close source tests PASS');
