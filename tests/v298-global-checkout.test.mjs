import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const required=[
 'db/migrations/136_v298_global_checkout_runtime.sql',
 'modules/platform/global-commerce-v298.ts',
 'modules/platform/global-money-v298.ts',
 'modules/commerce/transactions/global-checkout.ts',
 'app/api/checkout/global/quote/route.ts',
 'app/api/checkout/global/commit/route.ts',
];
for(const f of required) assert.ok(fs.existsSync(f),`missing ${f}`);
const migration=fs.readFileSync(required[0],'utf8');
for(const c of ['destination_country','locale','settlement_currency','shipping_mode','global_quote_id','fx_quote_json','tax_snapshot_json','global_pricing_json','pricing_version']) assert.match(migration,new RegExp(c));
const runtime=fs.readFileSync(required[1],'utf8');
assert.match(runtime,/quoteGlobalCart/); assert.match(runtime,/planMarketplaceCheckout/); assert.match(runtime,/V298\.0\.0/); assert.match(runtime,/BigInt/);
const commit=fs.readFileSync(required[3],'utf8');
assert.match(commit,/GLOBAL_QUOTE_PRICE_CHANGED/); assert.match(commit,/destination_country/); assert.match(commit,/global_quote_id/); assert.match(commit,/idempotency/);
execFileSync(process.execPath,['--experimental-strip-types','-e',`const m=await import(new URL('modules/platform/global-money-v298.ts','file://'+process.cwd()+'/')); if(m.minorToMajor(12345n,'USD')!==123.45) throw new Error('minor conversion'); if(m.minorToMajor(12345n,'JPY')!==12345) throw new Error('JPY conversion'); console.log('V298 global money PASS')`],{stdio:'inherit'});
console.log('V298 global checkout contract PASS');
