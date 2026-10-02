import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync(new URL('../db/migrations/159_v321_monetization_wiring.sql',import.meta.url),'utf8');
const settlement=fs.readFileSync(new URL('../modules/marketplace/economic-settlement.ts',import.meta.url),'utf8');
const refunds=fs.readFileSync(new URL('../modules/marketplace/financial-loop.ts',import.meta.url),'utf8');

assert.match(migration,/MARKETPLACE_DEFAULT/);
assert.match(migration,/2000/);
assert.match(settlement,/trust_revenue_ledger/);
assert.match(settlement,/surface:'COMMISSION'/);
assert.match(settlement,/surface:'PAYMENT_FEES'/);
assert.match(settlement,/surface:'FULFILLMENT'/);
assert.match(settlement,/on conflict\(idempotency_key\) do nothing/);
assert.match(refunds,/revenue-refund:/);
assert.match(refunds,/surface='COMMISSION'|'COMMISSION'/);
console.log('V321 monetization wiring source tests PASS');
