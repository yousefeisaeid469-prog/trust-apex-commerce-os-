export type GlobalLogisticsExecutionStatus='QUEUED'|'PROCESSING'|'LABEL_CREATED'|'FAILED'|'CANCELLED';
export interface LogisticsExecutionInput { orderId:string; shipmentId:string; country:string; currency:string; mode:'STANDARD'|'EXPRESS'|'PICKUP'; priority?:'BALANCED'|'COST'|'SPEED'|'RELIABILITY'; decisionIdempotencyKey:string; executionIdempotencyKey:string; }
export interface LogisticsExecutionResult { executionId:string; status:GlobalLogisticsExecutionStatus; carrierCode:string; serviceCode:string; trackingNumber?:string; providerReference?:string; attempts:number; replay?:boolean; }
