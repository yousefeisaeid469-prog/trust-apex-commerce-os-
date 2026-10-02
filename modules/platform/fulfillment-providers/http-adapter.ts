import type { FulfillmentProviderAdapter, FulfillmentProviderCapability, NormalizedTrackingUpdate, ProviderEnvironment } from './contracts';
import type { DeliveryExceptionCode, ShipmentStatus } from '../fulfillment-tracking-3/contracts';

const statuses: ShipmentStatus[] = ['PLANNED','LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','EXCEPTION','CANCELLED'];
const exceptions: DeliveryExceptionCode[] = ['ADDRESS_ISSUE','CUSTOMS_HOLD','DAMAGED','RECIPIENT_UNAVAILABLE','WEATHER_DELAY','CARRIER_DELAY','UNKNOWN'];
const required=(v:string,n:string)=>{if(!v?.trim())throw new Error(`${n}_REQUIRED`);return v.trim()};
const normalizeStatus=(v:unknown):ShipmentStatus=>{const s=String(v??'').toUpperCase();if(!statuses.includes(s as ShipmentStatus))throw new Error('PROVIDER_STATUS_INVALID');return s as ShipmentStatus};
const normalizeException=(v:unknown):DeliveryExceptionCode|undefined=>{if(v==null)return undefined;const x=String(v).toUpperCase();return exceptions.includes(x as DeliveryExceptionCode)?x as DeliveryExceptionCode:'UNKNOWN'};

export function createHttpFulfillmentAdapter(provider:string, environment:ProviderEnvironment, input:{baseUrl?:string;secret?:string}):FulfillmentProviderAdapter {
  const name=required(provider,'PROVIDER');
  const baseUrl=input.baseUrl?.replace(/\/$/,'');
  const secret=input.secret;
  const capabilities:FulfillmentProviderCapability[]=['CREATE_LABEL','TRACK','CANCEL_LABEL'];
  async function request(path:string, init:RequestInit, capability:string){
    if(!baseUrl||!secret)throw new Error(`PROVIDER_REQUIRED:${name}:${capability}`);
    const response=await fetch(`${baseUrl}${path}`,{...init,headers:{'content-type':'application/json','authorization':`Bearer ${secret}`,...(init.headers??{})}});
    const text=await response.text();let body:unknown;try{body=text?JSON.parse(text):null}catch{body={raw:text}};
    if(!response.ok)throw new Error(`PROVIDER_HTTP_${response.status}:${name}`);
    return body as Record<string,unknown>;
  }
  return {
    provider:name,environment,capabilities,
    async createLabel(i){const b=await request('/shipments',{method:'POST',body:JSON.stringify(i)},'CREATE_LABEL');const tracking=required(String(b.trackingNumber??''),'PROVIDER_TRACKING_NUMBER');return {trackingNumber:tracking,providerReference:b.providerReference?String(b.providerReference):undefined};},
    async cancelLabel(i){await request('/shipments/cancel',{method:'POST',body:JSON.stringify(i)},'CANCEL_LABEL');},
    async getTracking(i){const b=await request(`/tracking/${encodeURIComponent(i.trackingNumber)}`,{method:'GET'},'TRACK');const occurredAt=new Date(String(b.occurredAt??'')).toISOString();return {status:normalizeStatus(b.status),occurredAt,location:b.location?String(b.location):undefined,description:b.description?String(b.description):undefined,exceptionCode:normalizeException(b.exceptionCode),etaAt:b.etaAt?new Date(String(b.etaAt)).toISOString():undefined};},
    parseWebhook(i):NormalizedTrackingUpdate{const p=i.payload as Record<string,unknown>;return {provider:name,eventId:i.eventId,shipmentId:p.shipmentId?String(p.shipmentId):undefined,trackingNumber:p.trackingNumber?String(p.trackingNumber):undefined,status:normalizeStatus(p.status),occurredAt:new Date(String(p.occurredAt??new Date().toISOString())).toISOString(),location:p.location?String(p.location):undefined,description:p.description?String(p.description):undefined,exceptionCode:normalizeException(p.exceptionCode),etaAt:p.etaAt?new Date(String(p.etaAt)).toISOString():undefined,raw:i.payload};}
  };
}
