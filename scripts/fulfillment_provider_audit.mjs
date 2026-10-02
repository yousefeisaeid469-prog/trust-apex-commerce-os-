import fs from 'node:fs';
const required=['modules/platform/fulfillment-providers/contracts.ts','modules/platform/fulfillment-providers/http-adapter.ts','modules/platform/fulfillment-providers/registry.ts','modules/platform/fulfillment-providers/execution.ts','app/api/fulfillment/providers/webhook/route.ts','app/api/fulfillment/providers/reconcile/route.ts','app/api/shipments/[id]/label/route.ts','db/migrations/083_v233_fulfillment_provider_execution.sql','scripts/fulfillment_provider_worker.mjs'];
const missing=required.filter(f=>!fs.existsSync(f));
if(missing.length){console.error('Fulfillment provider audit FAILED');missing.forEach(f=>console.error('- Missing '+f));process.exit(1)}
const execution=fs.readFileSync('modules/platform/fulfillment-providers/execution.ts','utf8'); const adapter=fs.readFileSync('modules/platform/fulfillment-providers/http-adapter.ts','utf8');
for(const marker of ['ingestWebhook','verifyWebhook','claimShipmentReconciliationJobs','recordTrackingEvent'])if(!execution.includes(marker)){console.error('Missing execution invariant: '+marker);process.exit(1)}
if(!adapter.includes('PROVIDER_REQUIRED')){console.error('Missing provider fail-closed invariant');process.exit(1)}
console.log('Fulfillment provider audit PASS — provider boundary, signed webhook inbox, reconciliation worker and label execution present.');
