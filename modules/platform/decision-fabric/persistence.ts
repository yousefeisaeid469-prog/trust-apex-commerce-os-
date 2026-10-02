import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { withPgTransaction } from '../db/postgres';
import type { Decision, Evidence } from './index';

const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
async function appendAudit(client:PoolClient,input:{decisionId:string;tenantId:string;actorId?:string;eventType:string;payload:unknown}){
  await client.query(`select pg_advisory_xact_lock(hashtext('trust:decision-audit-chain'))`);
  const previous=await client.query<{chain_hash:string}>(`select chain_hash from trust_decision_audit order by id desc limit 1`);
  const previousHash=previous.rows[0]?.chain_hash??null;
  const payloadHash=sha(JSON.stringify(input.payload));
  const chainHash=sha(`${previousHash??''}:${input.eventType}:${payloadHash}`);
  await client.query(`insert into trust_decision_audit(decision_id,tenant_id,actor_id,event_type,payload_hash,previous_hash,chain_hash) values($1,$2,$3,$4,$5,$6,$7)`,[input.decisionId,input.tenantId,input.actorId??null,input.eventType,payloadHash,previousHash,chainHash]);
  return chainHash;
}

export async function persistDecision(input:{decision:Decision;evidence:Evidence[];tenantId:string;actorId?:string}){
  return withPgTransaction(async client=>{
    for(const e of input.evidence){
      await client.query(`insert into trust_evidence_records(id,tenant_id,subject_id,kind,status,source,source_type,provider_id,trust_level,observed_at,expires_at,confidence,claim,provenance,verified_at,content_hash) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) on conflict(id) do update set status=excluded.status,confidence=excluded.confidence,provenance=excluded.provenance,verified_at=excluded.verified_at`,[e.id,input.tenantId,evidenceSubject(e,input.decision),e.kind,e.status,e.source,e.sourceType??'UNKNOWN',e.providerId??null,e.trustLevel??'UNVERIFIED',e.observedAt,e.expiresAt??null,e.confidence,e.claim,e.provenance??{},e.status==='VERIFIED'?(e.provenance?.verifiedAt??new Date().toISOString()):null,e.provenance?.contentHash??sha(JSON.stringify(e))]);
    }
    await client.query(`insert into trust_decision_records(id,tenant_id,actor_id,subject_id,action,outcome,risk,confidence,rationale,missing_evidence,contradictions,reversible,human_review_required,policy_version,evidence_hash,trace_id,decision_version) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,1)`,[input.decision.id,input.tenantId,input.actorId??null,input.decision.subjectId,input.decision.action,input.decision.outcome,input.decision.risk,input.decision.confidence,input.decision.rationale,input.decision.missingEvidence,input.decision.contradictions,input.decision.reversible,input.decision.humanReviewRequired,input.decision.policyVersion,input.decision.evidenceHash,input.decision.traceId]);
    const auditHash=await appendAudit(client,{decisionId:input.decision.id,tenantId:input.tenantId,actorId:input.actorId,eventType:'decision.recorded',payload:input.decision});
    await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3)`,['decision.recorded',input.decision.id,JSON.stringify({decision:input.decision,auditHash})]);
    return {persisted:true,auditHash,decision:input.decision};
  });
}
function evidenceSubject(e:Evidence,decision:Decision){return decision.subjectId;}
