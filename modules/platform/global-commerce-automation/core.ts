import { randomUUID } from 'node:crypto';
import { query } from '../db/postgres.ts';
import { discoverCommerceIncidents, executeSafeIncidentAction } from '../global-commerce-incident-orchestrator/core.ts';
import { getActivePolicy, getLearningEvidence } from './learning-policy.ts';

export type AutomationStage='DETECT'|'CORRELATE'|'EXPLAIN'|'PLAN'|'APPROVE'|'EXECUTE'|'VERIFY'|'LEARN';
export type AutomationAction='RECOVER_ORDER_LEASES';

const STAGES:AutomationStage[]=['DETECT','CORRELATE','EXPLAIN','PLAN','APPROVE','EXECUTE','VERIFY','LEARN'];

function bounded(n:number,min=1,max=100){return Math.min(Math.max(Math.floor(n),min),max);}
function explain(i:any){
  if(i.kind==='WORK_STALLED') return {rootCause:'STALE_COMMERCE_WORK_LEASE',summary:'A consumer or execution lease is stale and may prevent durable commerce work from progressing.',confidence:'DETERMINISTIC'};
  if(i.kind==='PAYMENT_FAILURE_CLUSTER') return {rootCause:'RECENT_PAYMENT_FAILURE_CLUSTER',summary:'Payment failures occurred inside the observation window. No automatic money mutation is authorized by this layer.',confidence:'DETERMINISTIC'};
  return {rootCause:'INVENTORY_RESERVATION_PRESSURE',summary:'Recent inventory reservations indicate pressure. No automatic stock mutation is authorized by this layer.',confidence:'DETERMINISTIC'};
}

export async function createAutomationPlan(input:{fingerprint:string;actorEmail?:string;requestId?:string}){
  const incidents=await discoverCommerceIncidents(100);
  const incident=incidents.find(x=>x.fingerprint===input.fingerprint);
  if(!incident) throw new Error('INCIDENT_NOT_ACTIVE');
  const planId=randomUUID();
  const explanation=explain(incident);
  const candidateAction=incident.safeAction?.commandId as AutomationAction|undefined;
  const learnedPolicy=candidateAction ? await getActivePolicy(incident.fingerprint,candidateAction) : null;
  const evidence=await getLearningEvidence(incident.fingerprint);
  const action:AutomationAction|undefined=candidateAction;
  const plan={
    planId,fingerprint:incident.fingerprint,stages:STAGES,
    detect:{observedAt:new Date().toISOString()},correlate:{kind:incident.kind,scope:incident.scope},
    explain:explanation,
    plan:{action:action||null,requiresOwner:Boolean(action),requiresExplicitApproval:true,autoExecute:false,policyState:learnedPolicy?'ACTIVE':'UNLEARNED',policyRevision:learnedPolicy?.revision||null,learningEvidence:evidence,boundary:'Only bounded recovery may be delegated; payment, inventory, fulfillment and revenue mutations remain outside this automation layer.'},
  };
  await query(`insert into trust_commerce_automation_plans(plan_id,fingerprint,version,state,payload,created_by,created_at) values($1,$2,'V377.0.0','AWAITING_APPROVAL',$3::jsonb,$4,now())`,[planId,incident.fingerprint,JSON.stringify(plan),input.actorEmail||null]);
  return plan;
}

export async function approveAutomationPlan(input:{planId:string;actorEmail:string;reason:string}){
  if(!input.actorEmail) throw new Error('OWNER_AUTH_REQUIRED');
  if(input.reason.trim().length<3) throw new Error('APPROVAL_REASON_REQUIRED');
  const r=await query<any>(`update trust_commerce_automation_plans set state='APPROVED',approved_by=$2,approved_at=now(),approval_reason=$3 where plan_id=$1 and state='AWAITING_APPROVAL' returning *`,[input.planId,input.actorEmail,input.reason.trim()]);
  if(!r.rows[0]) throw new Error('PLAN_NOT_APPROVABLE');
  return r.rows[0];
}

export async function executeAutomationPlan(input:{planId:string;actorEmail:string;reason:string;requestId?:string}){
  const planR=await query<any>(`select * from trust_commerce_automation_plans where plan_id=$1 for update`,[input.planId]);
  const plan=planR.rows[0]; if(!plan) throw new Error('PLAN_NOT_FOUND');
  if(plan.state!=='APPROVED') throw new Error('PLAN_NOT_APPROVED');
  const payload=plan.payload||{}; const action=payload.plan?.action as AutomationAction|null;
  if(!action) throw new Error('NO_EXECUTABLE_ACTION');
  const orderId=payload.correlate?.scope?.orderId; if(!orderId) throw new Error('PLAN_TARGET_MISSING');
  await query(`update trust_commerce_automation_plans set state='EXECUTING',executed_by=$2,executed_at=now() where plan_id=$1`,[input.planId,input.actorEmail]);
  try{
    const result=await executeSafeIncidentAction({fingerprint:String(plan.fingerprint),commandId:action,orderId:String(orderId),actorEmail:input.actorEmail,reason:input.reason,requestId:input.requestId||randomUUID()});
    const verified=Boolean((result as any)?.result?.verified ?? (result as any)?.status==='EXECUTED');
    await query(`update trust_commerce_automation_plans set state=$2,result=$3::jsonb,verified=$4,completed_at=now() where plan_id=$1`,[input.planId,verified?'VERIFIED':'UNVERIFIED',JSON.stringify(result),verified]);
    await query(`insert into trust_commerce_automation_learning(plan_id,outcome,verified,evidence,created_at) values($1,$2,$3,$4::jsonb,now())`,[input.planId,verified?'RECOVERY_VERIFIED':'RECOVERY_UNVERIFIED',verified,JSON.stringify(result)]);
    return {planId:input.planId,state:verified?'VERIFIED':'UNVERIFIED',action,result};
  }catch(error){
    await query(`update trust_commerce_automation_plans set state='FAILED',result=$2::jsonb,completed_at=now() where plan_id=$1`,[input.planId,JSON.stringify({error:error instanceof Error?error.message:'AUTOMATION_EXECUTION_FAILED'})]);
    await query(`insert into trust_commerce_automation_learning(plan_id,outcome,verified,evidence,created_at) values($1,'EXECUTION_FAILED',false,$2::jsonb,now())`,[input.planId,JSON.stringify({error:error instanceof Error?error.message:'AUTOMATION_EXECUTION_FAILED'})]);
    throw error;
  }
}

export async function getAutomationOverview(limit=20){
  const safe=bounded(limit,1,50);
  const [plans,learning]=await Promise.all([
    query<any>(`select state,count(*)::int count from trust_commerce_automation_plans group by state order by state`),
    query<any>(`select outcome,count(*)::int count from trust_commerce_automation_learning group by outcome order by outcome`)
  ]);
  return {version:'V378.0.0',stages:STAGES,planStates:plans.rows,learning:learning.rows,executionPolicy:{autoExecute:false,approvalRequired:true,ownerRequired:true,businessMutationAuthority:'existing domain authorities'},recent: (await query<any>(`select plan_id,fingerprint,state,verified,created_at,completed_at from trust_commerce_automation_plans order by created_at desc limit $1`,[safe])).rows};
}
