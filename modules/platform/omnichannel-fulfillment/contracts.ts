export type Channel='WEB'|'MOBILE'|'MARKETPLACE'|'SOCIAL'|'STORE';
export type FulfillmentMode='SHIP'|'PICKUP'|'DELIVERY';
export type ReturnDisposition='RESTOCK'|'REFURBISH'|'LIQUIDATE'|'RECYCLE'|'INVESTIGATE';
export type ShipmentStatus='PLANNED'|'ALLOCATED'|'PICKING'|'SHIPPED'|'DELIVERED'|'CANCELLED';
export interface Warehouse{ id:string; region:string; lat:number; lon:number; active:boolean; capacityUnits:number; availableUnits:number; handlingHours:number; }
export interface InventoryNode{warehouseId:string; productId:string; available:number; reserved:number; inbound:number; }
export interface OrderLine{lineId:string; productId:string; quantity:number; unitPriceMinor:bigint; weightGrams:number;}
export interface DeliveryPromise{warehouseId:string; etaDays:number; cutoff:string; confidence:number; mode:FulfillmentMode;}
export interface ShipmentPlan{shipmentId:string; warehouseId:string; lineIds:string[]; status:ShipmentStatus; etaDays:number; mode:FulfillmentMode;}
export interface FulfillmentPlan{orderId:string; channel:Channel; shipments:ShipmentPlan[]; unallocatedLineIds:string[]; totalEtaDays:number; splitCount:number;}
export interface ReturnRequest{ id:string; orderId:string; lineId:string; reason:'DAMAGED'|'WRONG_ITEM'|'CHANGED_MIND'|'NOT_AS_DESCRIBED'|'LATE'|'OTHER'; quantity:number; eligibleUntil:string; }
export interface ReturnDecision{approved:boolean; disposition:ReturnDisposition; refundMinor:bigint; requiresInspection:boolean; reason:string;}
export interface DeliveryRoute{warehouseId:string; region:string; etaDays:number; distanceKm:number; costMinor:bigint; score:number;}
