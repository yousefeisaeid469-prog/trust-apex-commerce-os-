import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { enqueueDecisionCommand, runExecutionMeshOnce } from './execution-mesh.ts';

export type FabricWorkflowState='READY'|'PROCESSING'|'SUCCEEDED'|'RETRYING'|'FAILED'|'COMPENSATING'|'COMPENSATED'|'DEAD_LETTERED';
const MAX_ATTEMPTS=3;
const LEASE_SECONDS=120;
const RETRY_SECONDS=[5,30,120];
const ADAPTER='commerce.recovery.v382';

function bounded(n:number,min:number,max:number){return Math.min(Math.max(Math.floor(n),min),max)}

export async function createExecutionWorkflow(commandId:string,tenantId='global'){
  if(!commandId) throw new Error('COMMAND_ID_REQUIRED');
  return withPgTransaction(async client=>{
    const command=(await client.query<any>(`select * from trust_commerce_decision_commands where command_id=$1 for update`,[commandId])).rows[0];
    if(!command) throw new Error('COMMAND_NOT_FOUND');
    if(command.state!=='APPROVED') throw new Error('COMMAND_NOT_APPROVED');
    const existing=(await client.query<any>(`select * from trust_commerce_execution_fabric_workflows where command_id=$1`,[commandId])).rows[0];
    if(existing) return {workflow:existing,replayed:true};
    const workflowId=randomUUID();
    const correlationId=randomUUID();
    const workflow=(await client.query<any>(`insert into trust_commerce_execution_fabric_workflows(workflow_id,command_id,tenant_id,state,current_step,attempt_count,max_attempts,correlation_id) values($1,$2,$3,'READY',1,0,$4,$5) returning *`,[workflowId,commandId,tenantId,MAX_ATTEMPTS,correlationId])).rows[0];
    await client.query(`insert into trust_commerce_execution_fabric_steps(workflow_id,step_no,adapter_name,action,input,state) values($1,1,$2,$3,$4::jsonb,'READY')`,[workflowId,ADAPTER,String(command.action),JSON.stringify({commandId,tenantId,correlationId})]);
    return {workflow,replayed:false};
  });
}

async function reclaimExpired(limit=50){
  const safe=bounded(limit,1,100);
  return query<any>(`with picked as (select workflow_id from trust_commerce_execution_fabric_workflows where state='PROCESSING' and lease_until < now() order by lease_until asc limit $1 for update skip locked) update trust_commerce_execution_fabric_workflows w set state='RETRYING',lease_until=null,available_at=now(),last_error=coalesce(w.last_error,'FABRIC_LEASE_EXPIRED'),updated_at=now() from picked where w.workflow_id=picked.workflow_id returning w.*`,[safe]);
}

async function claim(workerId:string){
  return withPgTransaction(async client=>{
    const r=await client.query<any>(`select * from trust_commerce_execution_fabric_workflows where state in ('READY','RETRYING') and available_at<=now() order by available_at,created_at for update skip locked limit 1`);
    const workflow=r.rows[0]; if(!workflow) return null;
    const attempt=Number(workflow.attempt_count)+1;
    if(attempt>Number(workflow.max_attempts)){
      await client.query(`update trust_commerce_execution_fabric_workflows set state='DEAD_LETTERED',completed_at=now(),updated_at=now(),last_error='FABRIC_MAX_ATTEMPTS_EXCEEDED' where workflow_id=$1`,[workflow.workflow_id]);
      return null;
    }
    const updated=(await client.query<any>(`update trust_commerce_execution_fabric_workflows set state='PROCESSING',attempt_count=$2,lease_until=now()+($3||' seconds')::interval,updated_at=now() where workflow_id=$1 and state in ('READY','RETRYING') returning *`,[workflow.workflow_id,attempt,LEASE_SECONDS])).rows[0];
    await client.query(`update trust_commerce_execution_fabric_steps set state='PROCESSING',attempt_count=$2,lease_until=now()+($3||' seconds')::interval,started_at=coalesce(started_at,now()),updated_at=now() where workflow_id=$1 and step_no=$4 and state in ('READY','RETRYING')`,[workflow.workflow_id,attempt,LEASE_SECONDS,workflow.current_step]);
    return updated?{...updated,workerId}:null;
  });
}

async function finishFailure(workflow:any,workerId:string,error:string){
  const attempt=Number(workflow.attempt_count);
  const terminal=attempt>=Number(workflow.max_attempts);
  const state:FabricWorkflowState=terminal?'DEAD_LETTERED':'RETRYING';
  const delay=RETRY_SECONDS[Math.min(attempt-1,RETRY_SECONDS.length-1)]||120;
  await withPgTransaction(async client=>{
    await client.query(`update trust_commerce_execution_fabric_steps set state=$2,last_error=$3,lease_until=null,completed_at=case when $2='FAILED' then now() else completed_at end,updated_at=now() where workflow_id=$1 and step_no=$4`,[workflow.workflow_id,terminal?'FAILED':'RETRYING',error,workflow.current_step]);
    await client.query(`update trust_commerce_execution_fabric_workflows set state=$2,last_error=$3,lease_until=null,available_at=now()+($4||' seconds')::interval,completed_at=case when $2='DEAD_LETTERED' then now() else completed_at end,updated_at=now() where workflow_id=$1`,[workflow.workflow_id,state,error,delay]);
    if(terminal){
      const receiptId=randomUUID();
      await client.query(`insert into trust_commerce_execution_fabric_receipts(receipt_id,workflow_id,command_id,step_no,status,adapter_name,provider_result,verification) values($1,$2,$3,$4,'DEAD_LETTERED',$5,$6::jsonb,$7::jsonb)`,[receiptId,workflow.workflow_id,workflow.command_id,workflow.current_step,ADAPTER,JSON.stringify({error,workerId}),JSON.stringify({verified:false})]);
    }
  });
}

export async function runExecutionFabricOnce(workerId=`fabric-${randomUUID()}`){
  await reclaimExpired(100).catch(()=>null);
  const workflow=await claim(workerId);
  if(!workflow) return {status:'IDLE',workerId};
  try{
    const step=(await query<any>(`select * from trust_commerce_execution_fabric_steps where workflow_id=$1 and step_no=$2`,[workflow.workflow_id,workflow.current_step])).rows[0];
    if(!step) throw new Error('FABRIC_STEP_NOT_FOUND');
    const adapter=(await query<any>(`select * from trust_commerce_execution_fabric_adapters where adapter_name=$1 and state='ACTIVE'`,[step.adapter_name])).rows[0];
    if(!adapter) throw new Error('EXECUTION_ADAPTER_DISABLED');
    const enqueued=await enqueueDecisionCommand(String(workflow.command_id));
    const mesh=await runExecutionMeshOnce(`${workerId}:mesh`);
    const job=(await query<any>(`select * from trust_commerce_execution_mesh_jobs where command_id=$1`,[workflow.command_id])).rows[0];
    if(job?.state==='EXECUTED'){
      const receiptId=randomUUID();
      await withPgTransaction(async client=>{
        await client.query(`update trust_commerce_execution_fabric_steps set state='SUCCEEDED',output=$2::jsonb,lease_until=null,completed_at=now(),updated_at=now() where workflow_id=$1 and step_no=$3`,[workflow.workflow_id,JSON.stringify({enqueued,mesh,meshJobId:job.job_id}),workflow.current_step]);
        await client.query(`update trust_commerce_execution_fabric_workflows set state='SUCCEEDED',lease_until=null,completed_at=now(),updated_at=now() where workflow_id=$1`,[workflow.workflow_id]);
        await client.query(`insert into trust_commerce_execution_fabric_receipts(receipt_id,workflow_id,command_id,step_no,status,adapter_name,provider_result,verification) values($1,$2,$3,$4,'SUCCEEDED',$5,$6::jsonb,$7::jsonb)`,[receiptId,workflow.workflow_id,workflow.command_id,workflow.current_step,step.adapter_name,JSON.stringify({enqueued,mesh,meshJobId:job.job_id}),JSON.stringify({verified:true,delegatedAuthority:'V382 execution mesh'})]);
      });
      return {status:'SUCCEEDED',workflowId:workflow.workflow_id,commandId:workflow.command_id,receiptId,workerId};
    }
    if(job?.state==='DEAD_LETTERED'||job?.state==='FAILED') throw new Error(job.last_error||'EXECUTION_MESH_TERMINAL_FAILURE');
    throw new Error(mesh?.status==='FAILED'?String((mesh as any).error||'EXECUTION_MESH_FAILED'):'EXECUTION_MESH_PENDING');
  }catch(error){
    const message=error instanceof Error?error.message:'EXECUTION_FABRIC_FAILED';
    await finishFailure(workflow,workerId,message);
    return {status:'RETRYING',workflowId:workflow.workflow_id,commandId:workflow.command_id,error:message,attempt:Number(workflow.attempt_count),workerId};
  }
}

export async function getExecutionFabricOverview(limit=25){
  const safe=bounded(limit,1,50);
  const [states,steps,recent,adapters]=await Promise.all([
    query<any>(`select state,count(*)::int count from trust_commerce_execution_fabric_workflows group by state order by state`),
    query<any>(`select state,count(*)::int count from trust_commerce_execution_fabric_steps group by state order by state`),
    query<any>(`select workflow_id,command_id,tenant_id,state,current_step,attempt_count,max_attempts,last_error,created_at,completed_at from trust_commerce_execution_fabric_workflows order by created_at desc limit $1`,[safe]),
    query<any>(`select adapter_name,action,provider_kind,state,updated_at from trust_commerce_execution_fabric_adapters order by adapter_name`)
  ]);
  return {version:'V383.0.0',states:states.rows,steps:steps.rows,recent:recent.rows,adapters:adapters.rows,authority:{durableWorkflow:true,adapterRegistry:true,boundedRetries:true,leases:true,endToEndReceipts:true,delegatesToV382ExecutionMesh:true,domainMutationAuthority:'existing commerce authorities'}};
}
