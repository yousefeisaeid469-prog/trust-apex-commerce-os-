import { randomUUID } from 'node:crypto';
import { withPgTransaction } from '../modules/platform/db/postgres.ts';
import { submitCommandTx } from '../modules/platform/command-bus.ts';
import { commandHandler } from '../modules/platform/commands/registry.ts';
import { transitionRuntimeOperationTx } from '../modules/platform/runtime-spine.ts';
import { startWorker, heartbeatWorker, finishWorker } from '../modules/platform/worker-plane.ts';
import { acquireWorkerSlot, releaseWorkerSlot } from '../modules/platform/worker-scheduler.ts';
import { claimExecutionTx, completeExecutionClaimTx, executionFingerprint, failExecutionClaimTx } from '../modules/platform/execution-idempotency.ts';

const once=process.argv.includes('--once');
const batch=Math.max(1,Math.min(25,Number(process.env.TRUST_WORKFLOW_BATCH_SIZE??5)));
const workerId=`workflow-worker-${randomUUID()}`;
const maxAttempts=Math.max(1,Math.min(12,Number(process.env.TRUST_WORKFLOW_MAX_ATTEMPTS??6)));
const backoff=(n)=>Math.min(3600,2**Math.max(0,Math.min(n-1,10)));

async function one(){
  return withPgTransaction(async tx=>{
    const r=await tx.query(`WITH candidate AS (
      SELECT s.id FROM trust_workflow_steps s
      JOIN trust_workflow_instances w ON w.id=s.workflow_id
      WHERE w.status IN ('RUNNING','COMPENSATING')
        AND ((s.status='PENDING' AND s.step_type='COMMAND' AND s.available_at<=now())
          OR (s.status='RUNNING' AND (s.locked_at IS NULL OR s.locked_at<now()-interval '2 minutes'))
          OR (s.status='COMPENSATING' AND s.available_at<=now()))
      ORDER BY w.created_at,CASE WHEN w.status='COMPENSATING' THEN -s.step_index ELSE s.step_index END,s.id
      FOR UPDATE OF s SKIP LOCKED LIMIT 1
    ) UPDATE trust_workflow_steps s SET
      status=CASE WHEN s.status='COMPENSATING' THEN 'COMPENSATING' ELSE 'RUNNING' END,
      attempts=s.attempts+1,locked_at=now(),locked_by=$1,started_at=COALESCE(s.started_at,now()),updated_at=now()
      FROM candidate c WHERE s.id=c.id RETURNING s.*`,[workerId]);
    const step=r.rows[0]; if(!step) return false;
    const w=(await tx.query(`SELECT * FROM trust_workflow_instances WHERE id=$1 FOR UPDATE`,[step.workflow_id])).rows[0];
    if(!w) return false;
    const isComp=w.status==='COMPENSATING';
    const op=(await tx.query(`SELECT id FROM trust_runtime_operations WHERE tenant_id=$1 AND operation_type='workflow' AND operation_key=$2 FOR UPDATE`,[w.tenant_id,w.id])).rows[0];
    if(op) await transitionRuntimeOperationTx(tx,String(op.id),isComp?'RUNNING':'RUNNING',{eventType:isComp?'workflow.compensation.started':'workflow.execution.started',attempt:Number(step.attempts),payload:{workflowType:w.workflow_type,step:step.step_key,workerId}});
    try {
      if(isComp){
        if(!step.compensation_command_type){
          await tx.query(`UPDATE trust_workflow_steps SET status='COMPENSATED',locked_at=NULL,locked_by=NULL,completed_at=now(),updated_at=now() WHERE id=$1`,[step.id]);
        } else {
          const payload=step.compensation_payload_json ?? {};
          const cmd=await submitCommandTx(tx,{tenantId:w.tenant_id,commandType:String(step.compensation_command_type),
            aggregateType:String(w.aggregate_type),aggregateId:String(w.aggregate_id),
            idempotencyKey:`workflow:${w.id}:compensate:${step.step_index}`,payload,
            correlationId:String(w.correlation_id ?? w.id),causationId:String(step.command_id ?? w.id)});
          const handler=commandHandler(String(step.compensation_command_type));
          if(!handler) throw new Error('WORKFLOW_COMPENSATION_HANDLER_NOT_REGISTERED');
          const claim=await claimExecutionTx(tx,{scope:'command',operationKey:`command:${cmd.commandId}`,fingerprint:executionFingerprint({commandType:step.compensation_command_type,payload,aggregateId:w.aggregate_id}),ownerId:workerId,leaseSeconds:120});
          if(!claim) throw new Error('EXECUTION_CLAIM_BUSY');
          let compensationResult=claim.resultJson ?? {};
          if(!claim.replay){
            try {
              compensationResult=await handler({tx,command:{id:cmd.commandId,commandType:String(step.compensation_command_type),aggregateId:String(w.aggregate_id),payload,actorId:null}});
              await completeExecutionClaimTx(tx,claim,compensationResult ?? {});
            } catch(error) {
              await failExecutionClaimTx(tx,claim,error instanceof Error?error.message:String(error));
              throw error;
            }
          }
          await tx.query(`INSERT INTO trust_command_attempts(command_id,attempt,worker_id,status,result_json,finished_at)
            VALUES($1,1,$2,'SUCCEEDED',$3::jsonb,now())
            ON CONFLICT(command_id,attempt) DO UPDATE SET status='SUCCEEDED',result_json=EXCLUDED.result_json,finished_at=EXCLUDED.finished_at`,
            [cmd.commandId,workerId,JSON.stringify(compensationResult ?? {})]);
          await tx.query(`UPDATE trust_commands SET status='SUCCEEDED',result_json=$2::jsonb,completed_at=now(),locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,
            [cmd.commandId,JSON.stringify(compensationResult ?? {})]);
          await tx.query(`UPDATE trust_workflow_steps SET status='COMPENSATED',command_id=$2,locked_at=NULL,locked_by=NULL,completed_at=now(),updated_at=now(),result_json=$3::jsonb WHERE id=$1`,
            [step.id,cmd.commandId,JSON.stringify(compensationResult ?? {})]);
        }
        const pending=(await tx.query(`SELECT count(*)::int AS n FROM trust_workflow_steps WHERE workflow_id=$1 AND status NOT IN ('COMPENSATED','SKIPPED')`,[w.id])).rows[0].n;
        const compensated=Number(pending)===0;
        if(compensated) await tx.query(`UPDATE trust_workflow_instances SET status='COMPENSATED',completed_at=now(),updated_at=now(),locked_at=NULL,locked_by=NULL WHERE id=$1`,[w.id]);
        if(op) await transitionRuntimeOperationTx(tx,String(op.id),compensated?'SUCCEEDED':'RUNNING',{eventType:compensated?'workflow.compensation.completed':'workflow.compensation.step.completed',attempt:Number(step.attempts),payload:{step:step.step_key,workerId}});
        return true;
      }
      if(String(step.step_type ?? 'COMMAND')==='WAIT_FOR_EVENT'){
        await tx.query(`UPDATE trust_workflow_steps SET status='WAITING_EVENT',locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,[step.id]);
        await tx.query(`INSERT INTO trust_workflow_events(workflow_id,step_id,event_type,payload_json) VALUES($1,$2,'workflow.waiting_event',$3::jsonb)`,[w.id,step.id,JSON.stringify({eventType:step.wait_event_type,eventKey:step.wait_event_key})]);
        if(op) await transitionRuntimeOperationTx(tx,String(op.id),'WAITING',{eventType:'workflow.execution.waiting',attempt:Number(step.attempts),payload:{step:step.step_key,eventType:step.wait_event_type,eventKey:step.wait_event_key}});
        return true;
      }
      const payload=step.command_payload_json ?? {};
      const cmd=await submitCommandTx(tx,{tenantId:w.tenant_id,commandType:String(step.command_type),
        aggregateType:String(w.aggregate_type),aggregateId:String(w.aggregate_id),
        idempotencyKey:`workflow:${w.id}:step:${step.step_index}`,payload,
        correlationId:String(w.correlation_id ?? w.id),causationId:String(w.causation_id ?? w.id)});
      const handler=commandHandler(String(step.command_type));
      if(!handler) throw new Error('WORKFLOW_COMMAND_HANDLER_NOT_REGISTERED');
      const claim=await claimExecutionTx(tx,{scope:'command',operationKey:`command:${cmd.commandId}`,fingerprint:executionFingerprint({commandType:step.command_type,payload,aggregateId:w.aggregate_id}),ownerId:workerId,leaseSeconds:120});
      if(!claim) throw new Error('EXECUTION_CLAIM_BUSY');
      let commandResult=claim.resultJson ?? {};
      if(!claim.replay){
        try {
          commandResult=await handler({tx,command:{id:cmd.commandId,commandType:String(step.command_type),aggregateId:String(w.aggregate_id),payload,actorId:null}});
          await completeExecutionClaimTx(tx,claim,commandResult ?? {});
        } catch(error) {
          await failExecutionClaimTx(tx,claim,error instanceof Error?error.message:String(error));
          throw error;
        }
      }
      await tx.query(`INSERT INTO trust_command_attempts(command_id,attempt,worker_id,status,result_json,finished_at)
        VALUES($1,1,$2,'SUCCEEDED',$3::jsonb,now())
        ON CONFLICT(command_id,attempt) DO UPDATE SET status='SUCCEEDED',result_json=EXCLUDED.result_json,finished_at=EXCLUDED.finished_at`,
        [cmd.commandId,workerId,JSON.stringify(commandResult ?? {})]);
      await tx.query(`UPDATE trust_commands SET status='SUCCEEDED',result_json=$2::jsonb,completed_at=now(),locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,
        [cmd.commandId,JSON.stringify(commandResult ?? {})]);
      await tx.query(`UPDATE trust_workflow_steps SET status='SUCCEEDED',command_id=$2,result_json=$3::jsonb,locked_at=NULL,locked_by=NULL,completed_at=now(),updated_at=now() WHERE id=$1`,
        [step.id,cmd.commandId,JSON.stringify(commandResult ?? {})]);
      const next=(await tx.query(`SELECT step_index FROM trust_workflow_steps WHERE workflow_id=$1 AND status='PENDING' ORDER BY step_index LIMIT 1`,[w.id])).rows[0];
      if(next){ const nextType=(await tx.query(`SELECT step_type FROM trust_workflow_steps WHERE id=$1`,[next.id])).rows[0]?.step_type; if(nextType==='WAIT_FOR_EVENT') await tx.query(`UPDATE trust_workflow_steps SET status='WAITING_EVENT',updated_at=now() WHERE id=$1`,[next.id]); await tx.query(`UPDATE trust_workflow_instances SET current_step=$2,updated_at=now(),locked_at=NULL,locked_by=NULL WHERE id=$1`,[w.id,next.step_index]); }
      else { await tx.query(`UPDATE trust_workflow_instances SET status='SUCCEEDED',completed_at=now(),updated_at=now(),locked_at=NULL,locked_by=NULL WHERE id=$1`,[w.id]); if(op) await transitionRuntimeOperationTx(tx,String(op.id),'SUCCEEDED',{eventType:'workflow.execution.succeeded',attempt:Number(step.attempts),payload:{step:step.step_key,workerId}}); }
      await tx.query(`INSERT INTO trust_workflow_events(workflow_id,step_id,event_type,payload_json) VALUES($1,$2,'workflow.step.succeeded',$3::jsonb)`,
        [w.id,step.id,JSON.stringify({step:step.step_key,commandId:cmd.commandId})]);
      return true;
    } catch(error){
      const err=(error instanceof Error?error.message:String(error)).slice(0,2000);
      const terminal=Number(step.attempts)>=maxAttempts;
      if(terminal){
        const prior=(await tx.query(`SELECT step_index FROM trust_workflow_steps WHERE workflow_id=$1 AND status='SUCCEEDED' ORDER BY step_index DESC`,[w.id])).rows;
        await tx.query(`UPDATE trust_workflow_steps SET status='FAILED',error_code=$2,error_message=$2,locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,[step.id,err]);
        await tx.query(`UPDATE trust_workflow_instances SET status=$2,failure_code=$3,failure_message=$3,updated_at=now(),locked_at=NULL,locked_by=NULL WHERE id=$1`,
          [w.id,prior.length?'COMPENSATING':'FAILED',err]);
        if(op) await transitionRuntimeOperationTx(tx,String(op.id),prior.length?'RUNNING':'DEAD',{eventType:prior.length?'workflow.execution.compensating':'workflow.execution.dead',attempt:Number(step.attempts),errorCode:err,errorMessage:err,payload:{step:step.step_key,workerId}});
      } else {
        await tx.query(`UPDATE trust_workflow_steps SET status='PENDING',available_at=now()+make_interval(secs=>$2),locked_at=NULL,locked_by=NULL,error_code=$3,error_message=$3,updated_at=now() WHERE id=$1`,
          [step.id,backoff(Number(step.attempts)),err]);
        if(op) await transitionRuntimeOperationTx(tx,String(op.id),'WAITING',{eventType:'workflow.execution.retrying',attempt:Number(step.attempts),errorCode:err,errorMessage:err,payload:{step:step.step_key,workerId}});
      }
      await tx.query(`INSERT INTO trust_workflow_events(workflow_id,step_id,event_type,payload_json) VALUES($1,$2,$3,$4::jsonb)`,
        [w.id,step.id,terminal?'workflow.step.dead':'workflow.step.retrying',JSON.stringify({error:err,attempt:step.attempts})]);
      return true;
    }
  });
}
const worker = await startWorker('workflow', { workerId, metadata: { batch, maxAttempts } });
let claimed=0;
try {
  for(let i=0;i<batch;i++){const slot=await acquireWorkerSlot('workflow',worker.workerId,worker.leaseSeconds);if(!slot) break; try {const worked=await one();if(!worked)break;claimed++;await heartbeatWorker(worker,{claimed:1});if(once)break;} finally {await releaseWorkerSlot(slot);}}
  await finishWorker(worker,'SUCCEEDED',{counters:{claimed}});
  console.log(`V411 WORKFLOW WORKER PASS — worker=${workerId}`);
} catch(error) {
  const message=error instanceof Error?error.message:String(error);
  try { await finishWorker(worker,'FAILED',{errorCode:'WORKFLOW_WORKER_FAILED',errorMessage:message,counters:{claimed}}); } catch {}
  throw error;
}
