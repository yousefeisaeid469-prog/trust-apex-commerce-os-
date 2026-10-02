export type ShipmentStatus='PLANNED'|'LABEL_CREATED'|'PICKED_UP'|'IN_TRANSIT'|'OUT_FOR_DELIVERY'|'DELIVERED'|'EXCEPTION'|'CANCELLED';
export type DeliveryExceptionCode='ADDRESS_ISSUE'|'CUSTOMS_HOLD'|'DAMAGED'|'RECIPIENT_UNAVAILABLE'|'WEATHER_DELAY'|'CARRIER_DELAY'|'UNKNOWN';
export type TrackingEventType='STATUS'|'EXCEPTION'|'ETA_UPDATE';
export interface ShipmentRecord{id:string;orderId:string;carrier:string;service:string;trackingNumber:string|null;status:ShipmentStatus;warehouseId:string|null;etaAt:string|null;destination:any;createdAt:string;updatedAt:string;}
export interface TrackingEvent{id:string;shipmentId:string;eventType:TrackingEventType;status:ShipmentStatus|null;exceptionCode:DeliveryExceptionCode|null;occurredAt:string;location:string|null;description:string|null;etaAt:string|null;}
export interface CarrierAdapter{carrier:string;createShipment(input:{shipmentId:string;orderId:string;service:string;destination:any}):Promise<{trackingNumber:string;providerRef?:string}>;getTracking(input:{trackingNumber:string}):Promise<{status:ShipmentStatus;occurredAt:string;location?:string;description?:string;exceptionCode?:DeliveryExceptionCode;etaAt?:string}>;}
export const SHIPMENT_STATUS_ORDER:ShipmentStatus[]=['PLANNED','LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'];
export function normalizeShipmentStatus(value:string):ShipmentStatus{return SHIPMENT_STATUS_ORDER.includes(value as ShipmentStatus)||value==='EXCEPTION'||value==='CANCELLED'?value as ShipmentStatus:'PLANNED';}
export function trackingEventId(shipmentId:string,occurredAt:string,status:string,description:string|null=null){return `${shipmentId}:${occurredAt}:${status}:${description??''}`;}
export function isTerminalShipmentStatus(status:ShipmentStatus){return status==='DELIVERED'||status==='CANCELLED';}
