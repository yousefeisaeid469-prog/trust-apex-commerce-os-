import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { getLearningEvidence } from './learning-policy.ts';

const MIN_CANARY_SAMPLES = 3;
const MAX_FAILURE_RATE = 0.20;
const ALLOWED_ACTIONS = new Set(['RECOVER_ORDER_LEASES']);

function requireOwner(actor:string, reason:string){
  if(!actor) throw new Error('OWNER_AUTH_REQUIRED');
  if(reason.trim().length<3) throw new Error('GOVERNANCE_REASON_REQUIRED');
}

export async function createPolicyRevision(input:{policyKey:string;actorEmail:string;reason:string}){
  requireOwner(input.actorEmail,input.reason);
  const p=await query<any>(`select * from trust_commerce_automation_policies where policy_key=$1`,[input.policyKey]);
  const policy=p.rows[0]; if(!policy) throw new Error('POLICY_NOT_FOUND');
  if(!ALLOWED_ACTIONS.has(String(policy.action))) throw new Error('POLICY_ACTION_NOT_ALLOWED');
  const revision=`gov-${Date.now()}-${randomUUID().slice(0,8)}`;
  const revisionId=randomUUID();
  const r=await query<any>(`insert into trust_commerce_policy_revisions(revision_id,policy_key,revision,action,state,source_policy_id,created_by,creation_reason)
    values($1,$2,$3,$4,'PROPOSED',$5,$6,$7) returning *`,[revisionId,input.policyKey,revision,policy.action,policy.policy_id,input.actorEmail,input.reason.trim()]);
  return r.rows[0];
}

export async function evaluatePolicyCanary(input:{revisionId:string;actorEmail:string}){
  requireOwner(input.actorEmail,'canary');
  const r=await query<any>(`select * from trust_commerce_policy_revisions where revision_id=$1`,[input.revisionId]);
  const rev=r.rows[0]; if(!rev) throw new Error('REVISION_NOT_FOUND');
  const p=await query<any>(`select fingerprint from trust_commerce_automation_policies where policy_key=$1`,[rev.policy_key]);
  const fingerprint=p.rows[0]?.fingerprint; if(!fingerprint) throw new Error('POLICY_FINGERPRINT_NOT_FOUND');
  const evidence=await getLearningEvidence(fingerprint);
  const result=evidence.samples<MIN_CANARY_SAMPLES?'INCONCLUSIVE':evidence.failureRate<=MAX_FAILURE_RATE&&evidence.verifiedSamples>=MIN_CANARY_SAMPLES?'PASS':'FAIL';
  const evaluation={evaluationId:randomUUID(),revisionId:input.revisionId,fingerprint,samples:evidence.samples,verifiedSamples:evidence.verifiedSamples,failures:evidence.failures,failureRate:evidence.failureRate,result,evidence};
  await withPgTransaction(async client=>{
    await client.query(`update trust_commerce_policy_revisions set state='CANARY',updated_at=now() where revision_id=$1 and state='PROPOSED'`,[input.revisionId]);
    await client.query(`insert into trust_commerce_policy_canary_evaluations(evaluation_id,revision_id,fingerprint,samples,verified_samples,failures,failure_rate,result,evidence,evaluated_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`,[evaluation.evaluationId,evaluation.revisionId,evaluation.fingerprint,evaluation.samples,evaluation.verifiedSamples,evaluation.failures,evaluation.failureRate,evaluation.result,JSON.stringify(evidence),input.actorEmail]);
  });
  return evaluation;
}

export async function activatePolicyRevision(input:{revisionId:string;actorEmail:string;reason:string}){
  requireOwner(input.actorEmail,input.reason);
  return withPgTransaction(async client=>{
    const r=await client.query<any>(`select * from trust_commerce_policy_revisions where revision_id=$1 for update`,[input.revisionId]);
    const rev=r.rows[0]; if(!rev) throw new Error('REVISION_NOT_FOUND');
    const c=await client.query<any>(`select * from trust_commerce_policy_canary_evaluations where revision_id=$1 order by created_at desc limit 1`,[input.revisionId]);
    if(c.rows[0]?.result!=='PASS') throw new Error('LATEST_CANARY_NOT_PASSED');
    await client.query(`update trust_commerce_policy_revisions set state='ROLLED_BACK',rolled_back_by=$2,rollback_reason='SUPERSEDED_BY_NEW_REVISION',rolled_back_at=now(),updated_at=now() where policy_key=$1 and state='ACTIVE' and revision_id<>$3`,[rev.policy_key,input.actorEmail,input.revisionId]);
    const a=await client.query<any>(`update trust_commerce_policy_revisions set state='ACTIVE',activated_by=$2,activation_reason=$3,activated_at=now(),updated_at=now() where revision_id=$1 and state='CANARY' returning *`,[input.revisionId,input.actorEmail,input.reason.trim()]);
    if(!a.rows[0]) throw new Error('REVISION_NOT_ACTIVATABLE');
    return a.rows[0];
  });
}

export async function rollbackPolicy(input:{policyKey:string;actorEmail:string;reason:string}){
  requireOwner(input.actorEmail,input.reason);
  return withPgTransaction(async client=>{
    const r=await client.query<any>(`select * from trust_commerce_policy_revisions where policy_key=$1 and state='ACTIVE' for update`,[input.policyKey]);
    if(!r.rows[0]) throw new Error('ACTIVE_REVISION_NOT_FOUND');
    const prior=await client.query<any>(`select pr.* from trust_commerce_policy_revisions pr where pr.policy_key=$1 and pr.state='ROLLED_BACK' and exists(select 1 from trust_commerce_policy_canary_evaluations ce where ce.revision_id=pr.revision_id and ce.result='PASS') order by pr.updated_at desc limit 1`,[input.policyKey]);
    if(!prior.rows[0]) throw new Error('NO_PREVIOUS_CANARY_PASSED_REVISION');
    await client.query(`update trust_commerce_policy_revisions set state='ROLLED_BACK',rolled_back_by=$2,rollback_reason=$3,rolled_back_at=now(),updated_at=now() where revision_id=$1`,[r.rows[0].revision_id,input.actorEmail,input.reason.trim()]);
    const a=await client.query<any>(`update trust_commerce_policy_revisions set state='ACTIVE',activated_by=$2,activation_reason=$3,activated_at=now(),updated_at=now() where revision_id=$1 returning *`,[prior.rows[0].revision_id,input.actorEmail,input.reason.trim()]);
    return a.rows[0];
  });
}

export async function getActiveGovernedPolicy(fingerprint:string,action:string){
  const r=await query<any>(`select pr.* from trust_commerce_policy_revisions pr join trust_commerce_automation_policies p on p.policy_key=pr.policy_key where p.fingerprint=$1 and pr.action=$2 and pr.state='ACTIVE' order by pr.updated_at desc limit 1`,[fingerprint,action]);
  return r.rows[0]||null;
}

export async function getPolicyGovernanceOverview(limit=20){
  const safe=Math.min(Math.max(Math.floor(limit),1),50);
  const [revs,canaries]=await Promise.all([
    query<any>(`select * from trust_commerce_policy_revisions order by updated_at desc limit $1`,[safe]),
    query<any>(`select * from trust_commerce_policy_canary_evaluations order by created_at desc limit $1`,[safe])
  ]);
  return {version:'V379.0.0',requirements:{minCanarySamples:MIN_CANARY_SAMPLES,maxFailureRate:MAX_FAILURE_RATE},revisions:revs.rows,canaries:canaries.rows};
}
