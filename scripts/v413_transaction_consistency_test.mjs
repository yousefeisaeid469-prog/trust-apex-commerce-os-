import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[];
const migration=read('db/migrations/238_v413_global_transaction_consistency_mesh.sql');
checks.push(['event_key unique index',migration.includes('trust_outbox_events_event_key_uq')]);
checks.push(['external effect ledger',migration.includes('trust_external_effect_intents')]);
checks.push(['effect event ledger',migration.includes('trust_external_effect_events')]);
checks.push(['transactional helper',read('modules/platform/transaction-consistency.ts').includes('enqueueTransactionalOutboxTx')]);
checks.push(['fingerprint guard',read('modules/platform/transaction-consistency.ts').includes('EXTERNAL_EFFECT_FINGERPRINT_MISMATCH')]);
checks.push(['command event key',read('modules/platform/command-bus.ts').includes('command-request:${commandId}')]);
checks.push(['commerce event key',read('modules/commerce/core/order-execution.ts').includes('order-execution-started:${run.id}')]);
checks.push(['provider effect intent',read('scripts/payment_provider_worker.mjs').includes('payment-provider-create') && read('scripts/payment_provider_worker.mjs').includes('payment-provider-refund')]);
if(checks.some(([,ok])=>!ok)) { console.error('V413 TRANSACTION CONSISTENCY TEST FAIL',checks.filter(([,ok])=>!ok)); process.exit(1); }
console.log('V413 TRANSACTION CONSISTENCY TEST PASS');
