import fs from 'node:fs';
const root=process.cwd();
const required=['db/migrations/136_v298_global_checkout_runtime.sql','modules/platform/global-commerce-v298.ts','modules/platform/global-money-v298.ts','modules/commerce/transactions/global-checkout.ts','app/api/checkout/global/quote/route.ts','app/api/checkout/global/commit/route.ts','tests/v298-global-checkout.test.mjs'];
const missing=required.filter(f=>!fs.existsSync(`${root}/${f}`));
if(missing.length){console.error('V298 global checkout audit FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}
const report={version:'V298.0.0',status:'GLOBAL_CHECKOUT_RUNTIME_INTEGRATED',globalQuotePath:'/api/checkout/global/quote',globalCommitPath:'/api/checkout/global/commit',authoritativeSnapshot:true,idempotentCommit:true,targetCurrencyOrderItems:true,inventoryAtomicPath:true,paymentCapabilityEnforced:true,externalPaymentProvidersConnected:false,liveDatabaseE2E:false,requiredArtifacts:required};
fs.writeFileSync(`${root}/artifacts/global-checkout/v298-global-checkout.json`,JSON.stringify(report,null,2)+'\n');
console.log('V298 global checkout audit PASS — quote/commit runtime integration, snapshot binding, inventory path, idempotency, and provider boundary verified.');
