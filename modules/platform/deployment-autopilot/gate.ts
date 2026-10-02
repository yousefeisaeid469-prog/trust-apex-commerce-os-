import type {ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import type {DeploymentObservation,DeploymentGate} from './contracts.ts';
import {evaluateReleaseGate} from '../reliability-control-plane/gate.ts';
export function evaluateDeploymentObservation(policy:ReliabilityPolicy, observation:DeploymentObservation, observedAt:string):DeploymentGate {
  const result=evaluateReleaseGate(policy,{result:observation.labResult,replayStatus:observation.replayMatches?'PASS':'FAIL',knownFailure:!observation.newFailure});
  const reasons=[...result.reasons];
  if(observation.availability<policy.minAvailability) reasons.push(`availability<${policy.minAvailability}`);
  if(observation.errorRate>policy.maxErrorRate) reasons.push(`errorRate>${policy.maxErrorRate}`);
  if(observation.p95Ms>policy.maxP95Ms) reasons.push(`p95Ms>${policy.maxP95Ms}`);
  if(observation.budgetConsumedPct>policy.maxBudgetConsumedPct) reasons.push(`budgetConsumedPct>${policy.maxBudgetConsumedPct}`);
  if(!observation.replayMatches) reasons.push('replay-mismatch');
  return {status:reasons.length?'BLOCK':'PASS',reasons:[...new Set(reasons)],observedAt};
}
