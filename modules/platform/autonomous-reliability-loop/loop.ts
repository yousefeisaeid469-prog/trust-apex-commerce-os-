import {createHash} from 'node:crypto';
import type {EnforcementReceipt,IncidentSeverity,LoopDecision,ReliabilitySignal,RuntimeEnforcer,ReliabilityLearner} from './contracts.ts';
import {evaluateReleaseGate} from '../reliability-control-plane/gate.ts';
import {DEFAULT_RELIABILITY_POLICY,type ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import type {LabResult} from '../reliability-lab/engine.ts';

export interface ReliabilityLoopInput { incidentId:string; signal:ReliabilitySignal; result:LabResult; rolloutId:string; blastRadius:{serviceIds:string[];tenantIds:string[];rolloutIds:string[]}; mitigationReason?:string; }
export interface ReliabilityLoopResult { status:'RECOVERED'|'ROLLED_BACK'|'ESCALATED'|'BLOCKED'; decision:LoopDecision; incidentId:string; receipts:EnforcementReceipt[]; recovery:{verified:boolean;gate:'PASS'|'BLOCK'}; evidenceHash:string; learningHash?:string; }

function hash(x:unknown){return createHash('sha256').update(JSON.stringify(x)).digest('hex');}
function severity(signal:ReliabilitySignal):IncidentSeverity{if(signal.availability<.95||signal.errorRate>.05)return 'SEV1';if(signal.availability<.99||signal.errorRate>.01)return 'SEV2';return 'SEV3';}

export function runAutonomousReliabilityLoop(input:ReliabilityLoopInput,enforcer:RuntimeEnforcer,policy:ReliabilityPolicy=DEFAULT_RELIABILITY_POLICY,recoveryResult?:LabResult,learner?:ReliabilityLearner,rollbackResult?:LabResult):ReliabilityLoopResult{
  const receipts:EnforcementReceipt[]=[]; const s=input.signal;
  receipts.push(enforcer.openIncident(input.incidentId,severity(s),s));
  const affectedServices=input.blastRadius.serviceIds.length?input.blastRadius.serviceIds:[s.serviceId];
  const affectedTenants=input.blastRadius.tenantIds.length?(input.blastRadius.tenantIds):(s.tenantId?[s.tenantId]:[]);
  const affectedRollouts=input.blastRadius.rolloutIds.length?input.blastRadius.rolloutIds:[input.rolloutId];
  for(const id of affectedRollouts)receipts.push(enforcer.freezeRollout(id));
  for(const id of affectedServices)receipts.push(enforcer.isolateService(id));
  for(const id of affectedTenants)receipts.push(enforcer.isolateTenant(id));
  const gate=evaluateReleaseGate(policy,{result:input.result,replayStatus:s.replayMatches?'PASS':'FAIL',knownFailure:!s.newFailure});
  if(gate.status==='PASS'){
    for(const id of affectedRollouts)receipts.push(enforcer.resumeRollout(id));
    return finalize('RECOVERED','RESUME',input,receipts,true,gate.status,learner);
  }
  for(const id of affectedServices)receipts.push(enforcer.mitigate(id,input.mitigationReason||gate.reasons.join(',')));
  const verified=recoveryResult?evaluateReleaseGate(policy,{result:recoveryResult,replayStatus:'PASS',knownFailure:true}).status==='PASS':false;
  if(verified){for(const id of affectedRollouts)receipts.push(enforcer.resumeRollout(id));return finalize('RECOVERED','MITIGATE_AND_VERIFY',input,receipts,true,'PASS',learner);}
  if(input.rolloutId){receipts.push(enforcer.rollback(input.rolloutId));}
  const postRollbackVerified=rollbackResult?evaluateReleaseGate(policy,{result:rollbackResult,replayStatus:'PASS',knownFailure:true}).status==='PASS':false;
  if(postRollbackVerified){for(const id of affectedRollouts)receipts.push(enforcer.resumeRollout(id));return finalize('ROLLED_BACK','ROLLBACK',input,receipts,true,'PASS',learner);}
  receipts.push(enforcer.escalate(input.incidentId,gate.reasons.join(',')));
  return finalize('ESCALATED','ESCALATE',input,receipts,false,'BLOCK',learner);
}
function finalize(status:ReliabilityLoopResult['status'],decision:LoopDecision,input:ReliabilityLoopInput,receipts:EnforcementReceipt[],verified:boolean,gate:'PASS'|'BLOCK',learner?:ReliabilityLearner):ReliabilityLoopResult{const evidenceHash=hash({incidentId:input.incidentId,signal:input.signal,blastRadius:input.blastRadius,decision,receipts:receipts.map(r=>({action:r.action,target:r.target,accepted:r.accepted,reason:r.reason}))}); const reasons=receipts.filter(r=>r.action==='MITIGATE'||r.action==='ESCALATE').map(r=>r.reason); const learning=learner?.record({failureHash:input.signal.failureHash,decision,status,reasons,occurrence:1,policyRevision:hash(input.signal).slice(0,16)}); return {status,decision,incidentId:input.incidentId,receipts,recovery:{verified,gate},evidenceHash,learningHash:learning?.learningHash};}
