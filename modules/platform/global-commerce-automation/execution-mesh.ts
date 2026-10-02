import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { discoverCommerceIncidents, executeSafeIncidentAction } from '../global-commerce-incident-orchestrator/core.ts';
import { getActiveGovernedPolicy } from './policy-governance.ts';

export type MeshJobState='PENDING'|'PROCESSING'|'RETRYING'|'EXECUTED'|'FAILED'|'DEAD_LETTERED';
const MAX_ATTEMPTS=3;
const LEASE_SECONDS=120;
const BACKOFF_SECONDS=[5,30,120];

export async function enqueueDecisionCommand(commandId:string){
  if(!commandId) throw new Error('COMMAND_ID_REQUIRED');
  return withPgTransaction(async client=>{
    const c=(await client.query<any>(`select * from trust_commerce_decision_commands where command_id=$1 for update`,[commandId])).rows[0];
    if(!c) throw new Error('COMMAND_NOT_FOUND');
    if(c.state!=='APPROVED') throw new Error('COMMAND_NOT_APPROVED');
    const existing=(await client.query<any>(`select * from trust_commerce_execution_mesh_jobs where command_id=$1`,[commandId])).rows[0];
    if(existing) return {job:existing,replayed:true};
    const jobId=randomUUID();
    const row=(await client.query<any>(`insert into trust_commerce_execution_mesh_jobs(job_id,command_id,state,max_attempts) values($1,$2,'PENDING',$3) returning *`,[jobId,commandId,MAX_ATTEMPTS])).rows[0];
    return {job:row,replayed:false};
  });
}

export async function reclaimExpiredExecutionMeshLeases(limit=50){
  const safe=Math.min(Math.max(Math.floor(limit),1),100);
  return query<any>(`with picked as (
    select job_id from trust_commerce_execution_mesh_jobs
    where state='PROCESSING' and lease_until < now()
    order by lease_until asc limit $1 for update skip locked
  ) update trust_commerce_execution_mesh_jobs j set state='RETRYING',lease_until=null,available_at=now(),updated_at=now(),last_error=coalesce(j.last_error,'WORKER_LEASE_EXPIRED')
  from picked where j.job_id=picked.job_id returning j.*`,[safe]);
}

async function claim(workerId:string){
  return withPgTransaction(async client=>{
    const r=await client.query<any>(`select * from trust_commerce_execution_mesh_jobs where state in ('PENDING','RETRYING') and available_at<=now() order by available_at,created_at for update skip locked limit 1`);
    const job=r.rows[0]; if(!job) return null;
    const attemptNo=Number(job.attempt_count)+1;
    if(attemptNo>Number(job.max_attempts)){
      await client.query(`update trust_commerce_execution_mesh_jobs set state='DEAD_LETTERED',completed_at=now(),updated_at=now() where job_id=$1`,[job.job_id]);
      return null;
    }
    const updated=(await client.query<any>(`update trust_commerce_execution_mesh_jobs set state='PROCESSING',attempt_count=$2,lease_until=now()+($3||' seconds')::interval,updated_at=now() where job_id=$1 returning *`,[job.job_id,attemptNo,LEASE_SECONDS])).rows[0];
    await client.query(`insert into trust_commerce_execution_mesh_attempts(job_id,attempt_no,state,worker_id) values($1,$2,'STARTED',$3)`,[job.job_id,attemptNo,workerId]);
    return updated;
  });
}

async function failJob(job:any,workerId:string,error:string){
  const attempt=Number(job.attempt_count);
  const terminal=attempt>=Number(job.max_attempts);
  const state:MeshJobState=terminal?'DEAD_LETTERED':'RETRYING';
  const delay=BACKOFF_SECONDS[Math.min(attempt-1,BACKOFF_SECONDS.length-1)]||120;
  await withPgTransaction(async client=>{
    await client.query(`update trust_commerce_execution_mesh_attempts set state=$3,error=$4,completed_at=now() where job_id=$1 and attempt_no=$2 and worker_id=$5`,[job.job_id,attempt,terminal?'ABANDONED':'FAILED',error,workerId]);
    await client.query(`update trust_commerce_execution_mesh_jobs set state=$2,last_error=$3,lease_until=null,available_at=now()+($4||' seconds')::interval,completed_at=case when $2='DEAD_LETTERED' then now() else completed_at end,updated_at=now() where job_id=$1`,[job.job_id,state,error,delay]);
    if(terminal) await client.query(`update trust_commerce_decision_commands set state='FAILED',result=$2::jsonb,completed_at=now(),updated_at=now() where command_id=$1 and state='EXECUTING'`,[job.command_id,JSON.stringify({error,deadLettered:true})]);
  });
}

export async function runExecutionMeshOnce(workerId=`mesh-${randomUUID()}`){
  await reclaimExpiredExecutionMeshLeases(100).catch(()=>null);
  const job=await claim(workerId);
  if(!job) return {status:'IDLE',workerId};
  try{
    const command=(await query<any>(`select c.*,d.domain,d.outcome,d.input,d.evidence from trust_commerce_decision_commands c join trust_commerce_decision_requests d on d.decision_id=c.decision_id where c.command_id=$1`,[job.command_id])).rows[0];
    if(!command) throw new Error('COMMAND_NOT_FOUND');
    if(command.state==='EXECUTED') return {status:'ALREADY_EXECUTED',job};
    if(command.state!=='APPROVED') throw new Error('COMMAND_STATE_CHANGED');
    await query(`update trust_commerce_decision_commands set state='EXECUTING',executed_by=$2,execution_request_id=$3,executing_at=now(),updated_at=now() where command_id=$1 and state='APPROVED'`,[command.command_id,workerId,randomUUID()]);
    const action=String(command.action);
    const fingerprint=String(command.input?.fingerprint||command.evidence?.fingerprint||'');
    if(!fingerprint) throw new Error('INCIDENT_FINGERPRINT_REQUIRED');
    const policy=await getActiveGovernedPolicy(fingerprint,action);
    if(!policy) throw new Error('GOVERNED_POLICY_NOT_ACTIVE');
    const incident=(await discoverCommerceIncidents(100)).find(x=>x.fingerprint===fingerprint);
    if(!incident || incident.scope?.orderId!==command.target_order_id) throw new Error('INCIDENT_NO_LONGER_ACTIVE');
    const result=await executeSafeIncidentAction({fingerprint,commandId:action,orderId:String(command.target_order_id),actorEmail:String(command.approved_by||command.requested_by),reason:String(command.execution_reason||command.request_reason),requestId:randomUUID()});
    const verified=Boolean((result as any)?.result?.verified ?? (result as any)?.verified ?? (result as any)?.status==='EXECUTED');
    if(!verified) throw new Error('EXECUTION_VERIFICATION_FAILED');
    const receiptId=randomUUID();
    await withPgTransaction(async client=>{
      await client.query(`update trust_commerce_execution_mesh_attempts set state='SUCCEEDED',completed_at=now() where job_id=$1 and attempt_no=$2 and worker_id=$3`,[job.job_id,job.attempt_count,workerId]);
      await client.query(`update trust_commerce_execution_mesh_jobs set state='EXECUTED',lease_until=null,completed_at=now(),updated_at=now() where job_id=$1`,[job.job_id]);
      await client.query(`update trust_commerce_decision_commands set state='EXECUTED',result=$2::jsonb,verification=$3::jsonb,completed_at=now(),updated_at=now() where command_id=$1`,[command.command_id,JSON.stringify(result),JSON.stringify({verified,policyRevision:policy.revision,meshJobId:job.job_id})]);
      await client.query(`insert into trust_commerce_execution_mesh_receipts(receipt_id,job_id,command_id,status,action,attempt_no,provider_result,verification) values($1,$2,$3,'EXECUTED',$4,$5,$6::jsonb,$7::jsonb)`,[receiptId,job.job_id,command.command_id,action,job.attempt_count,JSON.stringify(result),JSON.stringify({verified,policyRevision:policy.revision})]);
    });
    return {status:'EXECUTED',workerId,jobId:job.job_id,commandId:command.command_id,receiptId,verified:true};
  }catch(error){
    const message=error instanceof Error?error.message:'EXECUTION_MESH_FAILED';
    await failJob(job,workerId,message);
    return {status:'FAILED',workerId,jobId:job.job_id,commandId:job.command_id,error:message,attempt:Number(job.attempt_count)};
  }
}

export async function getExecutionMeshOverview(limit=25){
  const safe=Math.min(Math.max(Math.floor(limit),1),50);
  const [states,recent]=await Promise.all([
    query<any>(`select state,count(*)::int count from trust_commerce_execution_mesh_jobs group by state order by state`),
    query<any>(`select job_id,command_id,state,attempt_count,max_attempts,lease_until,available_at,last_error,created_at,completed_at from trust_commerce_execution_mesh_jobs order by created_at desc limit $1`,[safe])
  ]);
  return {version:'V382.0.0',states:states.rows,recent:recent.rows,authority:{durableQueue:true,leases:true,boundedRetries:true,deadLetters:true,receipts:true,delegatesToDecisionCommandAuthority:true}};
}
