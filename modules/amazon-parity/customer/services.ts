export type Subscription = { id:string; customerId:string; productId:string; quantity:number; cadenceDays:number; nextRunAt:string; status:'active'|'paused'|'cancelled' };
export type PriceAlert = { id:string; customerId:string; productId:string; targetPriceCents:number; active:boolean };
export function nextReorderDate(now = new Date(), cadenceDays = 30) { const d = new Date(now); d.setDate(d.getDate()+cadenceDays); return d.toISOString(); }
