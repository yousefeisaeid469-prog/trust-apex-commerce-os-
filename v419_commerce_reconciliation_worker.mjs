import { randomUUID } from 'node:crypto';
import { withPgTransaction, databaseConfigured } from '../modules/platform/db/postgres.ts';
import { reconcileCommerceOrderTx, executeCommerceRecoveryPlanTx } from '../modules/commerce/core/recovery-engine.ts';
import { reconcileCommerceStateTx } from '../modules/commerce/core/state-reconciliation.ts';
if(!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
const workerId=`v419-commerce-reconciler-${process.pid}-${randomUUID()}`;
const once=process.argv.includes('--once');
const batch=Math.min(Math.max(Number(process.env.TRUST_V419_RECONCILIATION_BATCH??10),1),50);
let reconciled=0,stateReconciled=0,executed=0,blocked=0;
for(let i=0;i<batch;i++){
  const result=await withPgTransaction(async tx=>{
    const row=(await tx.query(`select o.id from trust_orders o left join trust_commerce_state_reconciliation r on r.order_id=o.id where o.status not in ('completed','refunded','cancelled') and (r.id is null or r.last_reconciled_at < now()-interval '2 minutes' or r.reconciliation_status in ('DRIFT','BLOCKED')) order by coalesce(r.updated_at,to_timestamp(0)) asc,o.created_at asc for update of o skip locked limit 1`)).rows[0];
    if(!row) return null;
    const recovery=await reconcileCommerceOrderTx(tx,String(row.id),workerId);
    const state=await reconcileCommerceStateTx(tx,String(row.id));
    return {recovery,state};
  });
  if(!result) break;
  reconciled++; stateReconciled++;
  const plan=await withPgTransaction(async tx=>{
    const row=(await tx.query(`select id from trust_commerce_recovery_plans where status='PENDING' and available_at<=now() order by created_at,id for update skip locked limit 1`)).rows[0];
    if(!row) return null;
    return executeCommerceRecoveryPlanTx(tx,String(row.id),workerId);
  });
  if(plan){executed++;if(plan.status==='BLOCKED')blocked++;}
  if(once) break;
}
console.log(JSON.stringify({version:'V419.0.0',workerId,reconciled,stateReconciled,executed,blocked},null,2));
