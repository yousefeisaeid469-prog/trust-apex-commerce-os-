import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { executeSafeIncidentAction, discoverCommerceIncidents } from '../global-commerce-incident-orchestrator/core.ts';
import { getActiveGovernedPolicy } from './policy-governance.ts';

export type DecisionCommandAction = 'RECOVER_ORDER_LEASES';
export type DecisionCommandState = 'CREATED'|'APPROVED'|'EXECUTING'|'EXECUTED'|'FAILED'|'REJECTED';

const ALLOWED_ACTIONS = new Set<DecisionCommandAction>(['RECOVER_ORDER_LEASES']);

function requireOwner(actorEmail:string, reason:string){
  if(!actorEmail) throw new Error('OWNER_AUTH_REQUIRED');
  if(reason.trim().length < 3) throw new Error('COMMAND_REASON_REQUIRED');
}

function parseAction(value:unknown):DecisionCommandAction{
  const action=String(value||'') as DecisionCommandAction;
  if(!ALLOWED_ACTIONS.has(action)) throw new Error('COMMAND_ACTION_NOT_ALLOWED');
  return action;
}

export async function createDecisionCommand(input:{decisionId:string;action:string;targetOrderId?:string;requestedBy:string;reason:string;idempotencyKey:string}){
  if(!input.decisionId) throw new Error('DECISION_ID_REQUIRED');
  if(!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  const action=parseAction(input.action);
  if(input.reason.trim().length<3) throw new Error('COMMAND_REASON_REQUIRED');

  const existing=await query<any>(`select * from trust_commerce_decision_commands where idempotency_key=$1`,[input.idempotencyKey.trim()]);
  if(existing.rows[0]) return {command:existing.rows[0],replayed:true};

  const decision=(await query<any>(`select * from trust_commerce_decision_requests where decision_id=$1`,[input.decisionId])).rows[0];
  if(!decision) throw new Error('DECISION_NOT_FOUND');
  if(decision.outcome!=='ALLOW') throw new Error('DECISION_NOT_EXECUTABLE');
  if(decision.domain!=='RECOVERY') throw new Error('DECISION_DOMAIN_NOT_EXECUTABLE');
  const policy=decision.policy;
  if(!policy || String(policy.action)!==action) throw new Error('DECISION_POLICY_ACTION_MISMATCH');
  if(!input.targetOrderId) throw new Error('TARGET_ORDER_ID_REQUIRED');
  const incident= (await discoverCommerceIncidents(100)).find(x=>x.fingerprint===String(decision.input?.fingerprint||decision.evidence?.fingerprint||''));
  if(!incident || incident.scope?.orderId!==input.targetOrderId) throw new Error('DECISION_TARGET_NOT_ACTIVE');

  const commandId=randomUUID();
  const row=await query<any>(`insert into trust_commerce_decision_commands
    (command_id,decision_id,idempotency_key,action,target_order_id,state,requested_by,request_reason,precondition)
    values($1,$2,$3,$4,$5,'CREATED',$6,$7,$8::jsonb) returning *`,
    [commandId,input.decisionId,input.idempotencyKey.trim(),action,input.targetOrderId,input.requestedBy,input.reason.trim(),JSON.stringify({decisionOutcome:decision.outcome,policyRevision:policy.revision,incidentFingerprint:incident.fingerprint})]);
  return {command:row.rows[0],replayed:false};
}

export async function approveDecisionCommand(input:{commandId:string;actorEmail:string;reason:string}){
  requireOwner(input.actorEmail,input.reason);
  return withPgTransaction(async client=>{
    const r=await client.query<any>(`select * from trust_commerce_decision_commands where command_id=$1 for update`,[input.commandId]);
    const command=r.rows[0]; if(!command) throw new Error('COMMAND_NOT_FOUND');
    if(command.state!=='CREATED') throw new Error('COMMAND_NOT_APPROVABLE');
    const decision=(await client.query<any>(`select * from trust_commerce_decision_requests where decision_id=$1`,[command.decision_id])).rows[0];
    if(!decision || decision.outcome!=='ALLOW') throw new Error('DECISION_NOT_EXECUTABLE');
    const updated=await client.query<any>(`update trust_commerce_decision_commands set state='APPROVED',approved_by=$2,approval_reason=$3,approved_at=now(),updated_at=now() where command_id=$1 returning *`,[input.commandId,input.actorEmail,input.reason.trim()]);
    await client.query(`insert into trust_commerce_decision_command_approvals(command_id,actor_email,reason,result) values($1,$2,$3,'APPROVED')`,[input.commandId,input.actorEmail,input.reason.trim()]);
    return updated.rows[0];
  });
}

export async function executeDecisionCommand(input:{commandId:string;actorEmail:string;reason:string;requestId?:string}){
  requireOwner(input.actorEmail,input.reason);
  const claimed=await withPgTransaction(async client=>{
    const r=await client.query<any>(`select c.*,d.domain,d.decision_type,d.outcome,d.policy,d.input,d.evidence from trust_commerce_decision_commands c join trust_commerce_decision_requests d on d.decision_id=c.decision_id where c.command_id=$1 for update`,[input.commandId]);
    const command=r.rows[0]; if(!command) throw new Error('COMMAND_NOT_FOUND');
    if(command.state==='EXECUTED') return {command,replayed:true};
    if(command.state!=='APPROVED') throw new Error('COMMAND_NOT_APPROVED');
    if(command.domain!=='RECOVERY' || command.outcome!=='ALLOW') throw new Error('DECISION_NOT_EXECUTABLE');
    const updated=await client.query<any>(`update trust_commerce_decision_commands set state='EXECUTING',executed_by=$2,execution_reason=$3,execution_request_id=$4,executing_at=now(),updated_at=now() where command_id=$1 returning *`,[input.commandId,input.actorEmail,input.reason.trim(),input.requestId||randomUUID()]);
    return {command:{...updated.rows[0],domain:command.domain,decision_type:command.decision_type,outcome:command.outcome,policy:command.policy,input:command.input,evidence:command.evidence},replayed:false};
  });
  if(claimed.replayed) return {command:claimed.command,replayed:true};

  const command=claimed.command;
  try{
    const action=parseAction(command.action);
    const fingerprint=String(command.input?.fingerprint||command.evidence?.fingerprint||'');
    if(!fingerprint) throw new Error('INCIDENT_FINGERPRINT_REQUIRED');
    const policy=await getActiveGovernedPolicy(fingerprint,action);
    if(!policy || String(policy.revision)!==String(command.precondition?.policyRevision)) throw new Error('GOVERNED_POLICY_CHANGED');
    const incident=(await discoverCommerceIncidents(100)).find(x=>x.fingerprint===fingerprint);
    if(!incident || incident.scope?.orderId!==command.target_order_id) throw new Error('INCIDENT_NO_LONGER_ACTIVE');
    const result=await executeSafeIncidentAction({fingerprint,commandId:action,orderId:String(command.target_order_id),actorEmail:input.actorEmail,reason:input.reason,requestId:command.execution_request_id});
    const verified=Boolean((result as any)?.result?.verified ?? (result as any)?.verified ?? (result as any)?.status==='EXECUTED');
    const state:DecisionCommandState=verified?'EXECUTED':'FAILED';
    const saved=await query<any>(`update trust_commerce_decision_commands set state=$2,result=$3::jsonb,verification=$4::jsonb,completed_at=now(),updated_at=now() where command_id=$1 returning *`,[command.command_id,state,JSON.stringify(result),JSON.stringify({verified,policyRevision:policy.revision,incidentFingerprint:fingerprint})]);
    return {command:saved.rows[0],result,verified,replayed:false};
  }catch(error){
    const message=error instanceof Error?error.message:'DECISION_COMMAND_EXECUTION_FAILED';
    await query(`update trust_commerce_decision_commands set state='FAILED',result=$2::jsonb,completed_at=now(),updated_at=now() where command_id=$1`,[command.command_id,JSON.stringify({error:message})]).catch(()=>null);
    throw error;
  }
}

export async function getDecisionCommandOverview(limit=25){
  const safe=Math.min(Math.max(Math.floor(limit),1),50);
  const [states,recent]=await Promise.all([
    query<any>(`select state,count(*)::int count from trust_commerce_decision_commands group by state order by state`),
    query<any>(`select command_id,decision_id,action,target_order_id,state,requested_by,approved_by,executed_by,created_at,completed_at from trust_commerce_decision_commands order by created_at desc limit $1`,[safe])
  ]);
  return {version:'V381.0.0',states:states.rows,recent:recent.rows,authority:{approvalRequired:true,ownerRequired:true,idempotent:true,revalidatesPolicyAndIncident:true,delegatesToExistingAuthority:true,directBusinessMutation:false}};
}
