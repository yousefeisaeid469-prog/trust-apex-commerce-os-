export type ReliabilityPolicy={
  minAvailability:number;
  maxErrorRate:number;
  maxP95Ms:number;
  maxBudgetConsumedPct:number;
  requireReplayMatch:boolean;
  blockOnNewFailure:boolean;
};
export const DEFAULT_RELIABILITY_POLICY:ReliabilityPolicy={minAvailability:0.995,maxErrorRate:0.005,maxP95Ms:500,maxBudgetConsumedPct:5,requireReplayMatch:true,blockOnNewFailure:true};
export function validatePolicy(p:ReliabilityPolicy){
  if(p.minAvailability<0||p.minAvailability>1)throw new Error('INVALID_MIN_AVAILABILITY');
  if(p.maxErrorRate<0||p.maxErrorRate>1)throw new Error('INVALID_MAX_ERROR_RATE');
  if(p.maxP95Ms<1)throw new Error('INVALID_MAX_P95');
  if(p.maxBudgetConsumedPct<0||p.maxBudgetConsumedPct>100)throw new Error('INVALID_BUDGET_LIMIT');
  return true;
}
