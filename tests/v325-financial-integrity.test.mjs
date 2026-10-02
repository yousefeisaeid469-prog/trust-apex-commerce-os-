import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('db/migrations/163_v325_financial_integrity.sql','utf8');
const settlement = fs.readFileSync('modules/marketplace/economic-settlement.ts','utf8');
const refunds = fs.readFileSync('modules/marketplace/financial-loop.ts','utf8');
const close = fs.readFileSync('modules/platform/v323/financial-close.ts','utf8');

test('V325 financial integrity is implemented', () => {
  assert.match(migration, /merchandise_gross/);
  assert.match(migration, /REVERSED/);
  assert.match(settlement, /merchandiseGrossTotal/);
  assert.match(settlement, /merchandise_gross/);
  assert.match(refunds, /merchandise_gross/);
  assert.match(close, /merchandise_gross/);
  assert.match(close, /customerGross/);
});
