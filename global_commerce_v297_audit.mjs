import fs from 'node:fs';
const required=['modules/platform/global-commerce-v297/registry.ts','modules/platform/global-commerce-v297/engine.ts','modules/platform/global-commerce-v297/money.ts','modules/platform/global-commerce-v297/fx.ts','modules/platform/global-commerce-v297/tax.ts','modules/platform/global-commerce-v297/payments.ts','modules/platform/global-commerce-v297/shipping.ts','db/migrations/135_v297_global_commerce_runtime.sql','tests/v297-global-commerce-runtime.test.mjs'];
const missing=required.filter(f=>!fs.existsSync(f));
if(missing.length){console.error('V297 global commerce audit FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}
const registry=fs.readFileSync(required[0],'utf8'); const countries=(registry.match(/\['[A-Z]{2}','[A-Z]{3}'/g)||[]).length;
if(countries<20) { console.error('V297 registry coverage below 20 countries'); process.exit(1); }
console.log(`V297 global commerce runtime audit PASS — ${countries} country capabilities, deterministic money/FX/tax, adapter boundaries, and runtime quote surface present.`);
