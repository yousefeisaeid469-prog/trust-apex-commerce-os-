import { createHash, randomUUID } from 'node:crypto';
import { query } from '../db/postgres.ts';

export type PolicyState = 'PROPOSED'|'ACTIVE'|'PAUSED';
export type LearnedAction = 'RECOVER_ORDER_LEASES';

const MIN_VERIFIED_SAMPLES = 3;
const MAX_FAILURE_RATE = 0.20;

function fingerprintPolicyKey(fingerprint:string, action:LearnedAction){
  return createHash('sha256').update(`${fingerprint}|${action}`).digest('hex');
}

export async function getLearningEvidence(fingerprint:string){
  const r = await query<any>(`select
      count(*)::int as samples,
      count(*) filter (where l.verified=true)::int as verified_samples,
      count(*) filter (where l.outcome='EXECUTION_FAILED')::int as failures,
      count(*) filter (where l.outcome='RECOVERY_UNVERIFIED')::int as unverified,
      count(*) filter (where l.outcome='RECOVERY_VERIFIED')::int as successes
    from trust_commerce_automation_learning l
    join trust_commerce_automation_plans p on p.plan_id=l.plan_id
    where p.fingerprint=$1`,[fingerprint]);
  const row=r.rows[0]||{};
  const samples=Number(row.samples||0), successes=Number(row.successes||0), failures=Number(row.failures||0);
  return {samples,verifiedSamples:Number(row.verified_samples||0),successes,failures,unverified:Number(row.unverified||0),failureRate:samples?failures/samples:0};
}

export async function proposeLearnedPolicy(input:{fingerprint:string;action:LearnedAction}){
  const evidence=await getLearningEvidence(input.fingerprint);
  const key=fingerprintPolicyKey(input.fingerprint,input.action);
  const eligible=evidence.verifiedSamples>=MIN_VERIFIED_SAMPLES && evidence.failureRate<=MAX_FAILURE_RATE && evidence.successes>=MIN_VERIFIED_SAMPLES;
  const revision=`${new Date().toISOString().slice(0,10)}-${evidence.verifiedSamples}-${evidence.failures}`;
  const proposal={policyId:randomUUID(),policyKey:key,fingerprint:input.fingerprint,action:input.action,evidence,eligible,requirements:{minVerifiedSamples:MIN_VERIFIED_SAMPLES,maxFailureRate:MAX_FAILURE_RATE},revision};
  await query(`insert into trust_commerce_automation_policies(policy_id,policy_key,fingerprint,action,state,revision,evidence,payload,created_at)
    values($1,$2,$3,$4,'PROPOSED',$5,$6::jsonb,$7::jsonb,now())
    on conflict(policy_key) do update set evidence=excluded.evidence,payload=excluded.payload,revision=excluded.revision,updated_at=now()
    returning *`,[proposal.policyId,key,input.fingerprint,input.action,revision,JSON.stringify(evidence),JSON.stringify(proposal)]);
  return proposal;
}

export async function promoteLearnedPolicy(input:{policyKey:string;actorEmail:string;reason:string}){
  if(!input.actorEmail) throw new Error('OWNER_AUTH_REQUIRED');
  if(input.reason.trim().length<3) throw new Error('POLICY_PROMOTION_REASON_REQUIRED');
  const r=await query<any>(`select * from trust_commerce_automation_policies where policy_key=$1`,[input.policyKey]);
  const policy=r.rows[0]; if(!policy) throw new Error('POLICY_NOT_FOUND');
  const evidence=policy.evidence||{};
  if(Number(evidence.verifiedSamples||0)<MIN_VERIFIED_SAMPLES || Number(evidence.failureRate||1)>MAX_FAILURE_RATE) throw new Error('POLICY_NOT_ELIGIBLE');
  const updated=await query<any>(`update trust_commerce_automation_policies
    set state='ACTIVE',approved_by=$2,approval_reason=$3,approved_at=now(),updated_at=now()
    where policy_key=$1 and state in ('PROPOSED','PAUSED') returning *`,[input.policyKey,input.actorEmail,input.reason.trim()]);
  if(!updated.rows[0]) throw new Error('POLICY_NOT_PROMOTABLE');
  return updated.rows[0];
}

export async function pauseLearnedPolicy(input:{policyKey:string;actorEmail:string;reason:string}){
  if(!input.actorEmail) throw new Error('OWNER_AUTH_REQUIRED');
  if(input.reason.trim().length<3) throw new Error('POLICY_PAUSE_REASON_REQUIRED');
  const r=await query<any>(`update trust_commerce_automation_policies set state='PAUSED',approved_by=$2,approval_reason=$3,updated_at=now() where policy_key=$1 and state='ACTIVE' returning *`,[input.policyKey,input.actorEmail,input.reason.trim()]);
  if(!r.rows[0]) throw new Error('POLICY_NOT_ACTIVE');
  return r.rows[0];
}

export async function getActivePolicy(fingerprint:string, action:LearnedAction){
  const key=fingerprintPolicyKey(fingerprint,action);
  const r=await query<any>(`select * from trust_commerce_automation_policies where policy_key=$1 and state='ACTIVE' limit 1`,[key]);
  return r.rows[0]||null;
}

export async function getLearningPolicyOverview(limit=20){
  const safe=Math.min(Math.max(Math.floor(limit),1),50);
  const rows=await query<any>(`select policy_id,policy_key,fingerprint,action,state,revision,evidence,approved_by,approved_at,created_at,updated_at
    from trust_commerce_automation_policies order by updated_at desc limit $1`,[safe]);
  return {version:'V378.0.0',requirements:{minVerifiedSamples:MIN_VERIFIED_SAMPLES,maxFailureRate:MAX_FAILURE_RATE},policies:rows.rows};
}
