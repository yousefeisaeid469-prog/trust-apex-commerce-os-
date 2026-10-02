import fs from 'node:fs';
import path from 'node:path';
const required={
 'modules/commerce/core/state-reconciliation.ts':['COMMERCE_STATE_RECONCILIATION_VERSION','deriveCommerceState','reconcileCommerceStateTx','trust_commerce_state_reconciliation'],
 'db/migrations/244_v419_global_commerce_state_reconciliation.sql':['trust_commerce_state_reconciliation','trust_commerce_state_reconciliation_events'],
 'modules/platform/commands/registry.ts':['completeOrderDelivery','trust_shipments','ORDER_DELIVERY_SHIPMENT_ID_REQUIRED'],
 'scripts/v419_commerce_reconciliation_worker.mjs':['reconcileCommerceOrderTx','reconcileCommerceStateTx','executeCommerceRecoveryPlanTx','V419.0.0'],
 'app/api/runtime/reconciliation/route.ts':['getCurrentUser','admin','operations','Cache-Control','V419.0.0'],
 'deploy/kubernetes/v419/reconciliation-worker-deployment.yaml':['trust-commerce-reconciliation-v419','v419_commerce_reconciliation_worker.mjs','trust-database'],
};
const errors=[];
for(const [file,tokens] of Object.entries(required)){const text=fs.readFileSync(path.join(process.cwd(),file),'utf8');for(const token of tokens)if(!text.includes(token))errors.push(`${file}: missing ${token}`);}
if(!/version.*419\.0\.0/s.test(fs.readFileSync('package.json','utf8')))errors.push('package version drift');
if(errors.length){console.error('V419 STATE RECONCILIATION AUDIT FAIL');for(const e of errors)console.error(e);process.exit(1);}
console.log('V419 STATE RECONCILIATION AUDIT PASS');
