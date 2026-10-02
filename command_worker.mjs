import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../modules/platform/db/postgres.ts';
import { commandHandler } from '../modules/platform/commands/registry.ts';
import { transitionRuntimeOperationTx } from '../modules/platform/runtime-spine.ts';
import { startWorker, heartbeatWorker, finishWorker } from '../modules/platform/worker-plane.ts';
import { acquireWorkerSlot, releaseWorkerSlot } from '../modules/platform/worker-scheduler.ts';
import { claimExecutionTx, completeExecutionClaimTx, executionFingerprint, failExecutionClaimTx } from '../modules/platform/execution-idempotency.ts';

const once=process.argv.includes('--once');
const batch=Math.max(1,Math.min(50,Number(process.env.TRUST_COMMAND_BATCH_SIZE??10)));
const maxAttempts=Math.max(1,Math.min(20,Number(process.env.TRUST_COMMAND_MAX_ATTEMPTS??8)));
const workerId=`command-worker-${randomUUID()}`;
const delay=(n)=>Math.min(3600,2**Math.max(0,Math.min(n-1,10)));

async function one(){
  return withPgTransaction(async tx=>{
    const r=await tx.query(`WITH candidate AS (
      SELECT id FROM trust_commands
      WHERE ((status IN ('PENDING','RETRYING') AND available_at<=now())
        OR (status='PROCESSING' AND (locked_at IS NULL OR locked_at<now()-interval '2 minutes')))
        AND status NOT IN ('DEAD','CANCELLED')
      ORDER BY available_at,created_at,id FOR UPDATE SKIP LOCKED LIMIT 1
    ) UPDATE trust_commands c SET status='PROCESSING',attempts=c.attempts+1,locked_at=now(),locked_by=$1,updated_at=now()
      FROM candidate x WHERE c.id=x.id
      RETURNING c.*`,[workerId]);
    const c=r.rows[0]; if(!c) return false;
    const attempt=Number(c.attempts);
    const executionClaim=await claimExecutionTx(tx,{scope:'command',operationKey:`command:${c.id}`,fingerprint:executionFingerprint({commandType:c.command_type,payload:c.payload_json??{},aggregateId:c.aggregate_id}),ownerId:workerId,leaseSeconds:120});
    if(!executionClaim) return true;
    if(executionClaim.replay){
      const replayResult=executionClaim.resultJson??{};
      await tx.query(`UPDATE trust_command_attempts SET status='SUCCEEDED',result_json=$2::jsonb,finished_at=now() WHERE command_id=$1 AND attempt=$3`,[c.id,JSON.stringify(replayResult),attempt]);
      await tx.query(`UPDATE trust_commands SET status='SUCCEEDED',result_json=$2::jsonb,locked_at=NULL,locked_by=NULL,last_error=NULL,completed_at=now(),updated_at=now() WHERE id=$1`,[c.id,JSON.stringify(replayResult)]);
      return true;
    }
    const op=(await tx.query(`SELECT id FROM trust_runtime_operations WHERE tenant_id=$1 AND operation_type='command' AND operation_key=$2 FOR UPDATE`,[c.tenant_id,c.id])).rows[0];
    if(op) await transitionRuntimeOperationTx(tx,String(op.id),'RUNNING',{eventType:'command.execution.started',attempt,payload:{commandType:c.command_type,workerId}});
    await tx.query(`INSERT INTO trust_command_attempts(command_id,attempt,worker_id,status) VALUES($1,$2,$3,'STARTED')`,[c.id,attempt,workerId]);
    const handler=commandHandler(String(c.command_type));
    if(!handler){
      const err='COMMAND_HANDLER_NOT_REGISTERED';
      const terminal=attempt>=maxAttempts;
      await tx.query(`UPDATE trust_command_attempts SET status=$2,error_code=$3,finished_at=now() WHERE command_id=$1 AND attempt=$4`,[c.id,terminal?'DEAD':'RETRYING',err,attempt]);
      await tx.query(`UPDATE trust_commands SET status=$2,available_at=now()+make_interval(secs=>$3),locked_at=NULL,locked_by=NULL,last_error=$4,updated_at=now() WHERE id=$1`,[c.id,terminal?'DEAD':'RETRYING',delay(attempt),err]);
      await failExecutionClaimTx(tx,executionClaim,err);
      if(op) await transitionRuntimeOperationTx(tx,String(op.id),terminal?'DEAD':'WAITING',{eventType:terminal?'command.execution.dead':'command.execution.retrying',attempt,errorCode:err,errorMessage:err,payload:{workerId}});
      return true;
    }
    try {
      const result=await handler({tx,command:{id:String(c.id),commandType:String(c.command_type),aggregateId:String(c.aggregate_id),payload:c.payload_json??{},actorId:c.actor_id}});
      await tx.query(`UPDATE trust_command_attempts SET status='SUCCEEDED',result_json=$2::jsonb,finished_at=now() WHERE command_id=$1 AND attempt=$3`,[c.id,JSON.stringify(result??{}),attempt]);
      await tx.query(`UPDATE trust_commands SET status='SUCCEEDED',result_json=$2::jsonb,locked_at=NULL,locked_by=NULL,last_error=NULL,completed_at=now(),updated_at=now() WHERE id=$1`,[c.id,JSON.stringify(result??{})]);
      await completeExecutionClaimTx(tx,executionClaim,result??{});
      if(op) await transitionRuntimeOperationTx(tx,String(op.id),'SUCCEEDED',{eventType:'command.execution.succeeded',attempt,payload:{workerId}});
      return true;
    } catch(error) {
      const err=(error instanceof Error?error.message:String(error)).slice(0,2000);
      const terminal=attempt>=maxAttempts;
      await tx.query(`UPDATE trust_command_attempts SET status=$2,error_code=$3,finished_at=now() WHERE command_id=$1 AND attempt=$4`,[c.id,terminal?'DEAD':'RETRYING',err,attempt]);
      await tx.query(`UPDATE trust_commands SET status=$2,available_at=now()+make_interval(secs=>$3),locked_at=NULL,locked_by=NULL,last_error=$4,updated_at=now() WHERE id=$1`,[c.id,terminal?'DEAD':'RETRYING',delay(attempt),err]);
      await failExecutionClaimTx(tx,executionClaim,err);
      if(op) await transitionRuntimeOperationTx(tx,String(op.id),terminal?'DEAD':'WAITING',{eventType:terminal?'command.execution.dead':'command.execution.retrying',attempt,errorCode:err,errorMessage:err,payload:{workerId}});
      return true;
    }
  });
}

const worker = await startWorker('command', { workerId, metadata: { batch, maxAttempts } });
let claimed=0;
try {
  for(let i=0;i<batch;i++){const slot=await acquireWorkerSlot('command',worker.workerId,worker.leaseSeconds);if(!slot) break; try {const worked=await one();if(!worked)break;claimed++;await heartbeatWorker(worker,{claimed:1});if(once)break;} finally {await releaseWorkerSlot(slot);}}
  await finishWorker(worker,'SUCCEEDED',{counters:{claimed}});
  console.log(`V411 COMMAND WORKER PASS — worker=${workerId}`);
} catch(error) {
  const message=error instanceof Error?error.message:String(error);
  try { await finishWorker(worker,'FAILED',{errorCode:'COMMAND_WORKER_FAILED',errorMessage:message,counters:{claimed}}); } catch {}
  throw error;
}
