export type GlobalTrackingStatus='PLANNED'|'LABEL_CREATED'|'PICKED_UP'|'IN_TRANSIT'|'OUT_FOR_DELIVERY'|'DELIVERED'|'EXCEPTION'|'CANCELLED';
export type GlobalTrackingReconciliation='APPLIED'|'DUPLICATE'|'STALE'|'UNMATCHED';
export type GlobalTrackingException='ADDRESS_ISSUE'|'CUSTOMS_HOLD'|'DAMAGED'|'RECIPIENT_UNAVAILABLE'|'WEATHER_DELAY'|'CARRIER_DELAY'|'UNKNOWN';
export interface CarrierTrackingWebhook {carrierCode:string;externalEventId:string;trackingNumber:string;status:GlobalTrackingStatus;occurredAt:string;location?:string;description?:string;exceptionCode?:GlobalTrackingException;etaAt?:string;payload?:unknown;}
export interface TrackingIngestResult {reconciliation:GlobalTrackingReconciliation;eventId:string;shipmentId?:string;status:GlobalTrackingStatus;}
const ORDER:GlobalTrackingStatus[]=['PLANNED','LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'];
export function statusRank(status:GlobalTrackingStatus){return ORDER.indexOf(status);}
export function isTerminal(status:GlobalTrackingStatus){return status==='DELIVERED'||status==='CANCELLED';}
export function shouldAdvance(current:GlobalTrackingStatus,next:GlobalTrackingStatus){
  if(current==='DELIVERED'||current==='CANCELLED') return false;
  if(next==='EXCEPTION') return current!=='EXCEPTION';
  if(current==='EXCEPTION') return next!=='PLANNED'&&next!=='LABEL_CREATED'&&next!=='EXCEPTION' ? true : false;
  return statusRank(next)>statusRank(current);
}
export function normalizeCarrierCode(value:string){const v=value.trim().toUpperCase();if(!v)throw new Error('CARRIER_REQUIRED');return v;}
export function normalizeTrackingNumber(value:string){const v=value.trim();if(!v)throw new Error('TRACKING_NUMBER_REQUIRED');return v;}
