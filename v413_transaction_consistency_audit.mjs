import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const failures=[];
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='413.0.0') failures.push('package.version');
if(!read('lib/runtime/version.ts').includes("RUNTIME_VERSION='413.0.0'")) failures.push('runtime.version');
if(!read('db/migrations/MANIFEST.json').includes('238_v413_global_transaction_consistency_mesh.sql')) failures.push('migration.manifest');
if(!read('modules/platform/transaction-consistency.ts').includes('ON CONFLICT(tenant_id,event_type,aggregate_id,event_key)')) failures.push('outbox.dedupe');
if(!read('modules/platform/command-bus.ts').includes('command-request:${commandId}')) failures.push('command.outbox.key');
if(!read('modules/commerce/core/order-execution.ts').includes('enqueueTransactionalOutboxTx')) failures.push('commerce.outbox.helper');
if(!read('scripts/payment_provider_worker.mjs').includes('ensureExternalEffectIntentTx')) failures.push('provider.effect.intent');
if(!read('scripts/payment_provider_worker.mjs').includes('completeExternalEffectTx')) failures.push('provider.effect.completion');
if(failures.length){console.error('V413 TRANSACTION CONSISTENCY AUDIT FAIL',failures);process.exit(1);}
console.log('V413 TRANSACTION CONSISTENCY AUDIT PASS');
