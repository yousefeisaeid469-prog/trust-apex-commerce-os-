import { randomUUID } from 'node:crypto';
import { withPgTransaction, databaseConfigured } from '../modules/platform/db/postgres.ts';
import { reconcileCommerceOrderTx, executeCommerceRecoveryPlanTx } from '../modules/commerce/core/recovery-engine.ts';
if(!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
const workerId=`v418-recovery-${process.pid}-${randomUUID()}`;
const once=process.argv.includes('--once');
const batch=Math.min(Math.max(Number(process.env.TRUST_V418_RECOVERY_BATCH??10),1),50);
let reconciled=0,executed=0,blocked=0;
for(let i=0;i<batch;i++){
  const result=await withPgTransaction(async tx=>{
    const row=(await tx.query(`select o.id from trust_orders o left join trust_commerce_execution_graphs g on g.order_id=o.id where o.status not in ('completed','refunded','cancelled') and (g.id is null or g.last_evaluated_at < now()-interval '2 minutes' or g.graph_state='BLOCKED') order by coalesce(g.updated_at,to_timestamp(0)) asc,o.created_at asc for update of o skip locked limit 1`)).rows[0];
    if(!row) return null;
    return reconcileCommerceOrderTx(tx,String(row.id),workerId);
  });
  if(!result) break;
  reconciled++;
  const plan=await withPgTransaction(async tx=>{
    const row=(await tx.query(`select id from trust_commerce_recovery_plans where status='PENDING' and available_at<=now() order by created_at,id for update skip locked limit 1`)).rows[0];
    if(!row) return null;
    return executeCommerceRecoveryPlanTx(tx,String(row.id),workerId);
  });
  if(plan){executed++;if(plan.status==='BLOCKED')blocked++;}
  if(once) break;
}
console.log(JSON.stringify({version:'V418.0.0',workerId,reconciled,executed,blocked},null,2));
