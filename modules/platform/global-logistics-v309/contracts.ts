export type RecoveryActionType='NO_ACTION'|'REQUEST_CARRIER_REFRESH'|'RETRY_LOGISTICS_EXECUTION'|'REVIEW_CUSTOMER_PROMISE'|'ESCALATE_CRITICAL_EXCEPTION';
export type RecoveryPlanStatus='PLANNED'|'EXECUTING'|'SUCCEEDED'|'FAILED'|'CANCELLED';
export interface RecoveryPlannerInput {
  shipmentId:string;
  orderId:string;
  riskBand:'GREEN'|'AMBER'|'RED';
  riskScore:number;
  riskReasons:string[];
  recommendedAction:RecoveryActionType;
  executionStatus?:string|null;
  criticalExceptions?:number;
}
export interface RecoveryPlanDecision { actionType:RecoveryActionType; priority:number; reasonCodes:string[]; requiresOperatorAttention:boolean; }
const priorityFor=(band:RecoveryPlannerInput['riskBand'],score:number)=>band==='RED'?Math.min(100,80+Math.round(score/5)):band==='AMBER'?Math.min(79,40+Math.round(score/4)):10;
export function planLogisticsRecovery(input:RecoveryPlannerInput):RecoveryPlanDecision{
  const reasons=[...new Set(input.riskReasons)];
  const critical=Number(input.criticalExceptions??0)>0;
  if(critical||input.riskBand==='RED'&&reasons.includes('CRITICAL_EXCEPTION_OPEN')) return {actionType:'ESCALATE_CRITICAL_EXCEPTION',priority:priorityFor(input.riskBand,input.riskScore),reasonCodes:reasons,requiresOperatorAttention:true};
  if(input.executionStatus==='FAILED'||input.recommendedAction==='RETRY_LOGISTICS_EXECUTION') return {actionType:'RETRY_LOGISTICS_EXECUTION',priority:priorityFor(input.riskBand,input.riskScore),reasonCodes:reasons,requiresOperatorAttention:false};
  if(input.recommendedAction==='REVIEW_CUSTOMER_PROMISE'||reasons.includes('ETA_OVERDUE')) return {actionType:'REVIEW_CUSTOMER_PROMISE',priority:priorityFor(input.riskBand,input.riskScore),reasonCodes:reasons,requiresOperatorAttention:true};
  if(input.recommendedAction==='REQUEST_CARRIER_REFRESH'||reasons.includes('CARRIER_EVENT_STALE')||reasons.includes('NO_CARRIER_EVENT_TIMESTAMP')) return {actionType:'REQUEST_CARRIER_REFRESH',priority:priorityFor(input.riskBand,input.riskScore),reasonCodes:reasons,requiresOperatorAttention:false};
  return {actionType:'NO_ACTION',priority:priorityFor(input.riskBand,input.riskScore),reasonCodes:reasons,requiresOperatorAttention:false};
}
