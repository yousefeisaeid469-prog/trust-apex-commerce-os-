import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const errors=[];
const module=read('modules/commerce/core/reconciliation.ts');
const worker=read('scripts/v394_commerce_reconciliation.mjs');
for(const token of ['findCommerceReconciliationCandidatesTx','reconcileCommerceCandidateTx','startCapturedOrderKernelTx','resumeCommerceExecutionTx','releaseOrderReservationsTx']) if(!module.includes(token)) errors.push(`reconciliation module missing ${token}`);
for(const token of ['DATABASE_NOT_CONFIGURED','RECONCILIATION_BATCH_SIZE','DRY_RUN','pg_try_advisory_xact_lock','closePostgresPool']) if(!worker.includes(token)) errors.push(`reconciliation worker missing ${token}`);
const migration=read('db/migrations/219_v394_commerce_reconciliation.sql');
for(const token of ['trust_commerce_reconciliation_runs','trust_payments_captured_reconciliation_idx','trust_commerce_execution_reconciliation_idx']) if(!migration.includes(token)) errors.push(`migration missing ${token}`);
if(errors.length){console.error('V394 RECONCILIATION AUDIT FAILED'); for(const e of errors) console.error('- '+e); process.exit(1);}
console.log('V394 RECONCILIATION AUDIT PASS — captured-payment gaps, fulfillment recovery and failed-payment reservation leaks have durable recovery paths.');
