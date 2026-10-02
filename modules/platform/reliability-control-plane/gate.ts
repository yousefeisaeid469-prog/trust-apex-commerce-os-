import type {LabResult} from '../reliability-lab/engine.ts';
import type {ReliabilityPolicy} from './policy.ts';
import {validatePolicy} from './policy.ts';
export type GateInput={result:LabResult; replayStatus:'PASS'|'FAIL'; knownFailure:boolean};
export type GateVerdict={status:'PASS'|'BLOCK';reasons:string[];measured:{availability:number;errorRate:number;p95Ms:number;budgetConsumedPct:number};};
export function evaluateReleaseGate(policy:ReliabilityPolicy,input:GateInput):GateVerdict{
  validatePolicy(policy); const r=input.result; const reasons:string[]=[];
  if(r.slo.availability<policy.minAvailability)reasons.push('SLO_AVAILABILITY_BREACH');
  if(r.slo.errorRate>policy.maxErrorRate)reasons.push('SLO_ERROR_RATE_BREACH');
  if(r.slo.p95Ms>policy.maxP95Ms)reasons.push('SLO_P95_BREACH');
  if(r.slo.budgetConsumedPct>policy.maxBudgetConsumedPct)reasons.push('ERROR_BUDGET_BREACH');
  if(policy.requireReplayMatch&&input.replayStatus!=='PASS')reasons.push('REPLAY_MISMATCH');
  if(policy.blockOnNewFailure&&!input.knownFailure&&r.status==='FAIL')reasons.push('NEW_FAILURE');
  return {status:reasons.length?'BLOCK':'PASS',reasons,measured:{availability:r.slo.availability,errorRate:r.slo.errorRate,p95Ms:r.slo.p95Ms,budgetConsumedPct:r.slo.budgetConsumedPct}};
}
