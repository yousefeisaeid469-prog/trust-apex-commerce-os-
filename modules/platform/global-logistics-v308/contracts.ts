export type LogisticsRiskBand='GREEN'|'AMBER'|'RED';
export type LogisticsAction='NO_ACTION'|'MONITOR'|'REQUEST_CARRIER_REFRESH'|'RETRY_LOGISTICS_EXECUTION'|'REVIEW_CUSTOMER_PROMISE'|'ESCALATE_CRITICAL_EXCEPTION';
export interface ControlTowerShipmentInput {
  shipmentStatus:string;
  etaAt?:string|null;
  lastEventAt?:string|null;
  executionStatus?:string|null;
  executionAttempts?:number;
  lastExecutionError?:string|null;
  openExceptions?:number;
  criticalExceptions?:number;
  now?:string;
}
export interface ControlTowerAssessment {
  riskBand:LogisticsRiskBand;
  riskScore:number;
  riskReasons:string[];
  recommendedAction:LogisticsAction;
}
export function assessLogisticsRisk(input:ControlTowerShipmentInput):ControlTowerAssessment{
  const now=new Date(input.now??new Date().toISOString()).getTime();
  const reasons:string[]=[]; let score=0;
  const status=input.shipmentStatus;
  const critical=Number(input.criticalExceptions??0), open=Number(input.openExceptions??0);
  if(status==='DELIVERED'||status==='CANCELLED') return {riskBand:'GREEN',riskScore:0,riskReasons:[],recommendedAction:'NO_ACTION'};
  if(critical>0){score+=55;reasons.push('CRITICAL_EXCEPTION_OPEN');}
  else if(open>0){score+=25;reasons.push('FULFILLMENT_EXCEPTION_OPEN');}
  if(input.executionStatus==='FAILED'){score+=25;reasons.push('LOGISTICS_EXECUTION_FAILED');}
  if(input.executionStatus==='QUEUED'&&Number(input.executionAttempts??0)>0){score+=10;reasons.push('LOGISTICS_EXECUTION_RETRY_PENDING');}
  if(input.etaAt){const eta=new Date(input.etaAt).getTime();if(Number.isFinite(eta)&&eta<now){score+=30;reasons.push('ETA_OVERDUE');}}
  if(input.lastEventAt){const ageHours=(now-new Date(input.lastEventAt).getTime())/3600000;if(Number.isFinite(ageHours)&&ageHours>=24&&['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(status)){score+=20;reasons.push('CARRIER_EVENT_STALE');}}
  else if(['LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(status)){score+=15;reasons.push('NO_CARRIER_EVENT_TIMESTAMP');}
  if(input.lastExecutionError&&input.executionStatus==='FAILED') reasons.push('LAST_EXECUTION_ERROR_PRESENT');
  score=Math.min(100,score);
  const riskBand:LogisticsRiskBand=score>=50?'RED':score>=20?'AMBER':'GREEN';
  let recommendedAction:LogisticsAction='MONITOR';
  if(critical>0) recommendedAction='ESCALATE_CRITICAL_EXCEPTION';
  else if(input.executionStatus==='FAILED') recommendedAction='RETRY_LOGISTICS_EXECUTION';
  else if(reasons.includes('ETA_OVERDUE')) recommendedAction='REVIEW_CUSTOMER_PROMISE';
  else if(reasons.includes('CARRIER_EVENT_STALE')||reasons.includes('NO_CARRIER_EVENT_TIMESTAMP')) recommendedAction='REQUEST_CARRIER_REFRESH';
  else if(riskBand==='GREEN') recommendedAction='NO_ACTION';
  return {riskBand,riskScore:score,riskReasons:reasons,recommendedAction};
}
export interface ControlTowerShipment {
  shipmentId:string; orderId:string; carrierCode:string; trackingNumber:string|null; shipmentStatus:string;
  etaAt:string|null; lastEventAt:string|null; executionStatus:string|null; executionAttempts:number;
  lastExecutionError:string|null; openExceptions:number; criticalExceptions:number; assessment:ControlTowerAssessment;
}
