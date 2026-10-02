import fs from 'node:fs';
const required = [
 'modules/platform/global-commerce-v296/contracts.ts','modules/platform/global-commerce-v296/engine.ts','modules/platform/global-commerce-v296/money.ts',
 'modules/platform/global-commerce-v296/country.ts','modules/platform/global-commerce-v296/fx.ts','modules/platform/global-commerce-v296/tax.ts',
 'modules/platform/global-commerce-v296/shipping.ts','modules/platform/global-commerce-v296/payments.ts','modules/platform/global-commerce-v296/index.ts',
 'db/migrations/134_v296_global_commerce.sql','tests/v296-global-commerce.test.mjs'
];
const errors=required.filter(f=>!fs.existsSync(f)).map(f=>`missing ${f}`);
const engine=fs.readFileSync('modules/platform/global-commerce-v296/engine.ts','utf8');
for(const token of ['quoteGlobalCart','FX_QUOTE_REQUIRED','calculateTax','quoteShipping','paymentMethods']) if(!engine.includes(token)) errors.push(`engine missing ${token}`);
if(errors.length){console.error('V296 global commerce audit FAILED');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('V296 global commerce audit PASS — country, currency, FX, tax, shipping and payment boundaries present.');
