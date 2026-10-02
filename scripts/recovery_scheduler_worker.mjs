import { randomUUID } from 'node:crypto';
import { withPgTransaction, query, databaseConfigured } from '../modules/platform/db/postgres.ts';
import { enqueueCommerceExecutionJobTx } from '../modules/commerce/core/execution-worker.ts';
import { startWorker, heartbeatWorker, finishWorker } from '../modules/platform/worker-plane.ts';
import { acquireWorkerSlot, releaseWorkerSlot, reclaimStaleWorkerSlots } from '../modules/platform/worker-scheduler.ts';

if(!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
const once=process.argv.includes('--once');
const batch=Math.max(1,Math.min(25,Number(process.env.TRUST_RECOVERY_BATCH_SIZE??5)));
const workerId=`recovery-worker-${process.pid}-${randomUUID()}`;
const worker=await startWorker('recovery',{workerId,metadata:{batch}});
let claimed=0,recovered=0;
async function one(){
  const slot=await acquireWorkerSlot('recovery',workerId,worker.leaseSeconds);
  if(!slot) return false;
  try {
    return await withPgTransaction(async tx=>{
      const r=await tx.query(`SELECT id,order_id,execution_run_id,job_id,attempt_count FROM trust_commerce_recovery_cases WHERE status IN ('OPEN','ESCALATED') AND severity<>'BLOCKED' ORDER BY CASE severity WHEN 'ESCALATED' THEN 0 ELSE 1 END,last_seen_at,id FOR UPDATE SKIP LOCKED LIMIT 1`);
      const c=r.rows[0]; if(!c) return false;
      await tx.query(`UPDATE trust_commerce_recovery_cases SET status='CLAIMED',updated_at=now() WHERE id=$1`,[c.id]);
      const job=await enqueueCommerceExecutionJobTx(tx,{orderId:String(c.order_id),executionRunId:String(c.execution_run_id),jobType:'RECOVER_ORDER',idempotencyKey:`recovery:${c.id}:${Number(c.attempt_count)+1}`});
      await tx.query(`UPDATE trust_commerce_recovery_cases SET job_id=$2,last_seen_at=now(),updated_at=now() WHERE id=$1`,[c.id,job.id]);
      await tx.query(`INSERT INTO trust_commerce_recovery_attempts(recovery_case_id,job_id,attempt_number,action,outcome,result_json) VALUES($1,$2,$3,'RESUME','RETRYING',$4::jsonb) ON CONFLICT(recovery_case_id,attempt_number) DO NOTHING`,[c.id,job.id,Number(c.attempt_count)+1,JSON.stringify({workerId,scheduled:true})]);
      return true;
    });
  } finally { await releaseWorkerSlot(slot); }
}
try {
  const stale=await reclaimStaleWorkerSlots();
  for(let i=0;i<batch;i++){const did=await one();if(!did)break;claimed++;recovered++;await heartbeatWorker(worker,{claimed:1,recovered:1});if(once)break;}
  await finishWorker(worker,'SUCCEEDED',{counters:{claimed,recovered}});
  console.log(JSON.stringify({version:'V411.0.0',workerId,claimed,recovered,staleReclaimed:stale.reclaimed},null,2));
} catch(error){ const message=error instanceof Error?error.message:String(error); try{await finishWorker(worker,'FAILED',{errorCode:'RECOVERY_SCHEDULER_FAILED',errorMessage:message,counters:{claimed,recovered}})}catch{}; throw error; }
