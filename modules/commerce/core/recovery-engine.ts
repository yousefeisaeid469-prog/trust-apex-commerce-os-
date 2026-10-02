import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { enqueueCommerceExecutionJobTx } from './execution-worker.ts';
import { ensureOrderRuntimeOperationTx } from '../../platform/runtime-spine.ts';
import { refreshCommerceExecutionGraphTx } from './execution-graph.ts';

export const COMMERCE_RECOVERY_ENGINE_VERSION='V418.0.0';

type Gap={code:string;severity:string;message?:string};

function actionForGap(code:string): 'ENSURE_RUNTIME'|'RESUME_EXECUTION'|'RETRY_RECOVERY'|'NO_SAFE_AUTOFIX'|'RESOLVE' {
  switch(code){
    case 'RUNTIME_OPERATION_MISSING': return 'ENSURE_RUNTIME';
    case 'CAPTURED_PAYMENT_NO_EXECUTION':
    case 'EXECUTION_NO_FULFILLMENT': return 'RESUME_EXECUTION';
    case 'PAYMENT_MISSING': return 'NO_SAFE_AUTOFIX';
    default: return 'NO_SAFE_AUTOFIX';
  }
}

export async function planCommerceRecoveryTx(tx:PoolClient, input:{orderId:string;gaps:Gap[];recoveryCaseId:string}) {
  const created:any[]=[];
  for(const gap of input.gaps){
    if(!gap?.code) continue;
    const action=actionForGap(gap.code);
    const key=`recovery-plan:${input.orderId}:${gap.code}`;
    const row=(await tx.query<any>(`insert into trust_commerce_recovery_plans(recovery_case_id,order_id,gap_code,action,idempotency_key)
      values($1,$2,$3,$4,$5) on conflict(idempotency_key) do update set updated_at=now() returning *`,
      [input.recoveryCaseId,input.orderId,gap.code,action,key])).rows[0];
    created.push(row);
  }
  return created;
}

export async function executeCommerceRecoveryPlanTx(tx:PoolClient, planId:string, workerId:string) {
  const token=randomUUID();
  const claimed=(await tx.query<any>(`update trust_commerce_recovery_plans
    set status='CLAIMED',lease_token=$2,lease_until=now()+interval '90 seconds',attempts=attempts+1,updated_at=now()
    where id=$1 and (status='PENDING' or (status='CLAIMED' and lease_until<now())) and available_at<=now() and attempts<max_attempts
    returning *`,[planId,token])).rows[0];
  if(!claimed) return {claimed:false};
  try {
    if(claimed.action==='ENSURE_RUNTIME'){
      const runtime=await ensureOrderRuntimeOperationTx(tx,String(claimed.order_id),{metadata:{source:'v418-recovery-engine',planId,workerId}});
      await tx.query(`update trust_commerce_recovery_plans set status='SUCCEEDED',lease_until=null,lease_token=null,result_json=$2::jsonb,completed_at=now(),updated_at=now() where id=$1 and lease_token=$3`,[planId,JSON.stringify({action:claimed.action,runtimeOperationId:runtime.operationId}),token]);
      return {claimed:true,status:'SUCCEEDED'};
    }
    if(claimed.action==='RESUME_EXECUTION' || claimed.action==='RETRY_RECOVERY'){
      const run=(await tx.query<any>(`select id from trust_commerce_execution_runs where order_id=$1 order by created_at desc,id desc limit 1`,[claimed.order_id])).rows[0];
      if(!run) throw new Error('RECOVERY_EXECUTION_RUN_MISSING');
      const job=await enqueueCommerceExecutionJobTx(tx,{orderId:String(claimed.order_id),executionRunId:String(run.id),jobType:'RECOVER_ORDER',idempotencyKey:`v418-plan:${planId}:${claimed.attempts}`});
      await tx.query(`update trust_commerce_recovery_plans set status='SUCCEEDED',lease_until=null,lease_token=null,result_json=$2::jsonb,completed_at=now(),updated_at=now() where id=$1 and lease_token=$3`,[planId,JSON.stringify({action:claimed.action,jobId:job.id}),token]);
      return {claimed:true,status:'SUCCEEDED',jobId:job.id};
    }
    if(claimed.action==='NO_SAFE_AUTOFIX'){
      await tx.query(`update trust_commerce_recovery_plans set status='BLOCKED',lease_until=null,lease_token=null,result_json=$2::jsonb,last_error_code='NO_SAFE_AUTOFIX',updated_at=now() where id=$1 and lease_token=$3`,[planId,JSON.stringify({action:claimed.action}),token]);
      return {claimed:true,status:'BLOCKED'};
    }
    await tx.query(`update trust_commerce_recovery_plans set status='SUCCEEDED',lease_until=null,lease_token=null,completed_at=now(),updated_at=now() where id=$1 and lease_token=$2`,[planId,token]);
    return {claimed:true,status:'SUCCEEDED'};
  } catch(error){
    const code=error instanceof Error?error.message:String(error);
    const terminal=Number(claimed.attempts)>=Number(claimed.max_attempts);
    await tx.query(`update trust_commerce_recovery_plans set status=$2,lease_until=null,lease_token=null,last_error_code=$3,available_at=now()+($4 || ' seconds')::interval,updated_at=now() where id=$1 and lease_token=$5`,[planId,terminal?'FAILED':'PENDING',code,Math.min(300,Math.max(5,2**Math.min(Number(claimed.attempts),6))),token]);
    return {claimed:true,status:terminal?'FAILED':'PENDING',errorCode:code};
  }
}

export async function reconcileCommerceOrderTx(tx:PoolClient, orderId:string, workerId='reconciler') {
  const graph=await refreshCommerceExecutionGraphTx(tx,orderId);
  const gaps=Array.isArray(graph.gaps_json)?graph.gaps_json:[];
  if(!gaps.length) return {orderId,graphState:graph.graph_state,recoveryCaseId:null,plans:[]};
  const primary=gaps.find((g:Gap)=>g.severity==='CRITICAL') ?? gaps[0];
  const severity=primary.severity==='CRITICAL'?'BLOCKED':(primary.severity==='WARNING'?'RECOVERABLE':'BLOCKED');
  const existing=(await tx.query<any>(`select id from trust_commerce_recovery_cases where order_id=$1 and status in ('OPEN','CLAIMED','ESCALATED') order by updated_at desc,id desc limit 1 for update`,[orderId])).rows[0];
  const caseRow=existing ?? (await tx.query<any>(`insert into trust_commerce_recovery_cases(order_id,boundary,failure_code,severity,status,metadata_json) values($1,'UNKNOWN',$2,$3,'OPEN',$4::jsonb) returning id`,[orderId,`GRAPH:${primary.code}`,severity,JSON.stringify({source:'v418-reconciler',workerId,gaps})])).rows[0];
  const plans=await planCommerceRecoveryTx(tx,{orderId,gaps,recoveryCaseId:String(caseRow.id)});
  return {orderId,graphState:graph.graph_state,recoveryCaseId:String(caseRow.id),plans:plans.map(p=>({id:String(p.id),action:p.action,status:p.status,gapCode:p.gap_code}))};
}

export async function recoveryEngineSnapshot(db:{query:(sql:string,params?:unknown[])=>Promise<any>},limit=100){
  const n=Math.min(Math.max(Number(limit)||50,1),200);
  return (await db.query(`select * from trust_commerce_recovery_engine_snapshot order by updated_at desc limit $1`,[n])).rows;
}
