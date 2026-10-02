import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = process.cwd();
const files = [
  'modules/platform/global-commerce-v296/contracts.ts',
  'modules/platform/global-commerce-v296/money.ts',
  'modules/platform/global-commerce-v296/country.ts',
  'modules/platform/global-commerce-v296/fx.ts',
  'modules/platform/global-commerce-v296/tax.ts',
  'modules/platform/global-commerce-v296/shipping.ts',
  'modules/platform/global-commerce-v296/payments.ts',
  'modules/platform/global-commerce-v296/engine.ts',
  'modules/platform/global-commerce-v296/index.ts',
  'db/migrations/134_v296_global_commerce.sql',
];
for (const f of files) assert.ok(fs.existsSync(f), `missing ${f}`);
const engine = fs.readFileSync('modules/platform/global-commerce-v296/engine.ts','utf8');
const money = fs.readFileSync('modules/platform/global-commerce-v296/money.ts','utf8');
const fx = fs.readFileSync('modules/platform/global-commerce-v296/fx.ts','utf8');
const tax = fs.readFileSync('modules/platform/global-commerce-v296/tax.ts','utf8');
const migration = fs.readFileSync('db/migrations/134_v296_global_commerce.sql','utf8');
assert.match(engine,/quoteGlobalCart/); assert.match(engine,/FX_QUOTE_REQUIRED/); assert.match(engine,/SETTLEMENT_CURRENCY_NOT_SUPPORTED/);
assert.match(money,/CURRENCY_MISMATCH/); assert.match(money,/BigInt/);
assert.match(fx,/FX_QUOTE_EXPIRED/); assert.match(fx,/FX_BASE_MISMATCH/);
assert.match(tax,/calculateTax/); assert.match(tax,/rate/);
for (const table of ['trust_global_country_policies','trust_global_fx_quotes','trust_global_tax_rules','trust_global_quote_evidence']) assert.match(migration,new RegExp(`create table if not exists ${table}`));
console.log('V296 global commerce contract PASS');
