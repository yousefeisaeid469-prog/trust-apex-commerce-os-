export interface SellerInventoryItem { sku:string; available:number; reserved:number; inbound:number; reorderPoint:number; }
export interface SellerPerformance { sellerId:string; lateShipmentRate:number; cancellationRate:number; returnRate:number; responseHours:number; defectRate:number; }
export interface Promotion { id:string; type:'COUPON'|'DEAL'|'BUNDLE'|'LOYALTY'; active:boolean; startsAt:string; endsAt:string; }
export interface SellerHealth { score:number; status:'HEALTHY'|'WATCH'|'RESTRICTED'; reasons:string[]; }
