export type UsageMetric='orders'|'api_requests'|'ai_tokens'|'storage_bytes'|'events';
export interface UsageEvent {tenantId:string; metric:UsageMetric; quantity:number; idempotencyKey:string; occurredAt:string}
export function validateUsageEvent(e:UsageEvent){
  if(!e.tenantId || !e.idempotencyKey) throw new Error('USAGE_IDENTITY_REQUIRED');
  if(!Number.isFinite(e.quantity) || e.quantity<=0) throw new Error('USAGE_QUANTITY_INVALID');
  if(!e.occurredAt || Number.isNaN(Date.parse(e.occurredAt))) throw new Error('USAGE_TIMESTAMP_INVALID');
  return Object.freeze({...e});
}
export function usageKey(e:UsageEvent){return `${e.tenantId}:${e.metric}:${e.idempotencyKey}`}
