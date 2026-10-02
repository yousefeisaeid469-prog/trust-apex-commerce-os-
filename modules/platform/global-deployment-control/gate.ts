import type {ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import type {GlobalRolloutPlan,RegionObservation} from './contracts.ts';
export function evaluateRegion(policy:ReliabilityPolicy,plan:GlobalRolloutPlan,observation:RegionObservation){
  const reasons:string[]=[];
  if(observation.trafficWeightPct>plan.maxRegionalBlastRadiusPct) reasons.push('REGIONAL_BLAST_RADIUS_EXCEEDED');
  if(observation.trafficWeightPct>plan.maxGlobalBlastRadiusPct) reasons.push('GLOBAL_BLAST_RADIUS_EXCEEDED');
  if(observation.capacityAvailablePct<observation.trafficWeightPct) reasons.push('INSUFFICIENT_CAPACITY');
  if(plan.requireRegionalHealth&&!observation.dependencyHealthy) reasons.push('DEPENDENCY_UNHEALTHY');
  if(observation.availability<policy.minAvailability) reasons.push('AVAILABILITY_BELOW_POLICY');
  if(observation.errorRate>policy.maxErrorRate) reasons.push('ERROR_RATE_ABOVE_POLICY');
  if(observation.p95Ms>policy.maxP95Ms) reasons.push('P95_ABOVE_POLICY');
  if(observation.budgetConsumedPct>policy.maxBudgetConsumedPct) reasons.push('BUDGET_ABOVE_POLICY');
  if(policy.requireReplayMatch&&!observation.replayMatches) reasons.push('REPLAY_MISMATCH');
  if(policy.blockOnNewFailure&&observation.newFailure) reasons.push('NEW_FAILURE');
  return {passed:reasons.length===0,reasons};
}
