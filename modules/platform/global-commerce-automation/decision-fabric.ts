import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { discoverCommerceIncidents } from '../global-commerce-incident-orchestrator/core.ts';
import { getActiveGovernedPolicy } from './policy-governance.ts';

export type DecisionDomain='ORDER'|'PAYMENT'|'INVENTORY'|'FULFILLMENT'|'DELIVERY'|'RETURNS'|'DISPUTES'|'PAYOUTS'|'REVENUE'|'RECOVERY'|'GENERAL';
export type DecisionOutcome='ALLOW'|'REQUIRE_APPROVAL'|'DENY'|'NO_DECISION';

const BUSINESS_DOMAINS=new Set<DecisionDomain>(['ORDER','PAYMENT','INVENTORY','FULFILLMENT','DELIVERY','RETURNS','DISPUTES','PAYOUTS','REVENUE']);

function bounded(n:number,min=1,max=100){return Math.min(Math.max(Math.floor(n),min),max)}
function domainOf(value:string):DecisionDomain{const d=value.toUpperCase() as DecisionDomain;return ['ORDER','PAYMENT','INVENTORY','FULFILLMENT','DELIVERY','RETURNS','DISPUTES','PAYOUTS','REVENUE','RECOVERY','GENERAL'].includes(d)?d:'GENERAL'}

export async function evaluateCommerceDecision(input:{domain:string;decisionType:string;subjectId?:string;requestedBy?:string;payload?:Record<string,unknown>}){
  const domain=domainOf(input.domain); const decisionId=randomUUID(); const evaluationId=randomUUID(); const payload=input.payload||{};
  let outcome:DecisionOutcome='NO_DECISION'; let status='NO_DECISION'; let authority='decision-fabric-read-only';
  const rules:any[]=[]; let policy:any=null; let evidence:any={domain,decisionType:input.decisionType,subjectId:input.subjectId||null};

  if(domain==='RECOVERY'){
    const fingerprint=String(payload.fingerprint||'');
    if(!fingerprint) {rules.push({ruleId:'RECOVERY_FINGERPRINT_REQUIRED',result:'BLOCKED',rationale:'Recovery decisions require an observed incident fingerprint.'});outcome='DENY';status='DENIED';}
    else {
      const incidents=await discoverCommerceIncidents(100); const incident=incidents.find(x=>x.fingerprint===fingerprint);
      rules.push({ruleId:'RECOVERY_INCIDENT_ACTIVE',result:incident?'MATCH':'NO_MATCH',rationale:incident?'Observed incident is currently active.':'Incident is not currently active.'});
      if(!incident){outcome='DENY';status='DENIED'}
      else if(incident.kind==='WORK_STALLED' && incident.safeAction?.commandId){
        policy=await getActiveGovernedPolicy(fingerprint,String(incident.safeAction.commandId));
        rules.push({ruleId:'RECOVERY_GOVERNED_POLICY',result:policy?'MATCH':'BLOCKED',rationale:policy?'An active canary-passed governed revision exists.':'No active governed revision exists.'});
        if(policy){outcome='ALLOW';status='EVALUATED';authority='V373 verified recovery authority';evidence={...incident.evidence,incidentKind:incident.kind,governedRevision:policy.revision,action:policy.action}}
        else {outcome='REQUIRE_APPROVAL';status='REQUIRES_APPROVAL';authority='existing recovery authority';evidence={...incident.evidence,incidentKind:incident.kind}}
      } else {outcome='REQUIRE_APPROVAL';status='REQUIRES_APPROVAL';authority='existing domain authority';evidence=incident.evidence}
    }
  } else if(BUSINESS_DOMAINS.has(domain)){
    rules.push({ruleId:'BUSINESS_MUTATION_BOUNDARY',result:'BLOCKED',rationale:'The decision fabric does not own money, inventory, fulfillment, delivery, return, dispute, payout or revenue mutations.'});
    outcome='REQUIRE_APPROVAL';status='REQUIRES_APPROVAL';authority='existing domain authority';
  } else {
    rules.push({ruleId:'NO_DOMAIN_AUTHORITY',result:'NO_MATCH',rationale:'No executable authority is registered for this decision domain.'});
    outcome='NO_DECISION';status='NO_DECISION';
  }

  evidence={...evidence,requestPayload:payload,rules};
  const record={decisionId,domain,decisionType:input.decisionType,subjectId:input.subjectId||null,requestedBy:input.requestedBy||null,status,outcome,evidence,policy,authority};
  await withPgTransaction(async client=>{
    await client.query(`insert into trust_commerce_decision_requests(decision_id,domain,decision_type,subject_id,requested_by,input,status,outcome,evidence,policy,authority) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10::jsonb,$11)`,[decisionId,domain,input.decisionType,input.subjectId||null,input.requestedBy||null,JSON.stringify(payload),status,outcome,JSON.stringify(evidence),policy?JSON.stringify(policy):null,authority]);
    for(const rule of rules) await client.query(`insert into trust_commerce_decision_evaluations(evaluation_id,decision_id,rule_id,result,rationale,evidence) values($1,$2,$3,$4,$5,$6::jsonb)`,[randomUUID(),decisionId,rule.ruleId,rule.result,rule.rationale,JSON.stringify(rule)]);
  });
  return record;
}

export async function getDecisionFabricOverview(limit=25){
  const safe=bounded(limit,1,50);
  const [recent,counts]=await Promise.all([
    query<any>(`select decision_id,domain,decision_type,subject_id,status,outcome,authority,created_at from trust_commerce_decision_requests order by created_at desc limit $1`,[safe]),
    query<any>(`select outcome,count(*)::int count from trust_commerce_decision_requests group by outcome order by outcome`)
  ]);
  return {version:'V380.0.0',outcomes:counts.rows,recent:recent.rows,boundary:{readEvidence:true,recordDecisions:true,directBusinessMutation:false,executionAuthority:'existing domain authorities'}};
}
