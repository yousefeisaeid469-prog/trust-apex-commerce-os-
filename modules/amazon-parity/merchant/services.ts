export type SellerHealth = { orderDefectRate:number; lateShipmentRate:number; cancellationRate:number; returnRate:number };
export function sellerHealthScore(h: SellerHealth) { return Math.max(0, Math.min(100, 100 - h.orderDefectRate*1000 - h.lateShipmentRate*500 - h.cancellationRate*500 - h.returnRate*100)); }
