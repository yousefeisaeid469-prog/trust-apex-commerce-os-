import type {SqlExecutor} from '../../platform/persistence/postgres-boundary';
import type {GuardianOverview,PurchaseAlert,PurchasePassport} from './contracts';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function uuid(v:string){if(!UUID.test(v))throw new Error('CUSTOMER_ID_REQUIRED');return v;}
export function buildAlerts(input:{returnWindowEndsAt:string|null;warrantyEndsAt:string|null;status:string}):PurchaseAlert[]{
 const alerts:PurchaseAlert[]=[];const now=Date.now();
 const add=(type:PurchaseAlert['type'],end:string|null,window:number,title:string,action:string)=>{if(!end)return;const due=Date.parse(end);if(!Number.isFinite(due))return;const days=Math.ceil((due-now)/86400000);if(days>=0&&days<=window)alerts.push({type,severity:'warning',title,message:`متبقي ${days} يوم على الموعد.`,dueAt:end,action});};
 add('return_window',input.returnWindowEndsAt,7,'فترة الإرجاع قربت تخلص','review_return');
 add('warranty',input.warrantyEndsAt,30,'الضمان قرب ينتهي','review_warranty');
 return alerts;
}
export async function loadGuardianOverview(db:SqlExecutor,customerId:string):Promise<GuardianOverview>{
 uuid(customerId);
 const orders=await db.query<any>(`select o.id,o.status,o.total,o.currency,o.created_at,o.created_at + interval '14 days' as return_window_ends_at,
 (select max(we.created_at + (((we.metadata->>'warrantyDays')::int) * interval '1 day')) from trust_warranty_events we where we.customer_id=o.customer_id and we.order_id=o.id and we.event_type='warranty_registered' and (we.metadata->>'warrantyDays') ~ '^[0-9]+$') as warranty_ends_at
 from trust_orders o where o.customer_id=$1 order by o.created_at desc limit 100`,[customerId]);
 const ids=orders.rows.map((r:any)=>String(r.id));
 const items=ids.length?await db.query<any>(`select oi.order_id,oi.product_id,oi.quantity,oi.unit_price,p.name from trust_order_items oi join trust_products p on p.id=oi.product_id where oi.order_id=any($1::uuid[]) order by oi.order_id`,[ids]):{rows:[]};
 const grouped=new Map<string,any[]>();for(const r of items.rows){const k=String(r.order_id);const a=grouped.get(k)??[];a.push({productId:String(r.product_id),name:String(r.name),quantity:Number(r.quantity),unitPrice:Number(r.unit_price)});grouped.set(k,a);}
 const purchases:PurchasePassport[]=orders.rows.map((o:any)=>{const ret=o.return_window_ends_at?new Date(o.return_window_ends_at).toISOString():null;const war=o.warranty_ends_at?new Date(o.warranty_ends_at).toISOString():null;return {orderId:String(o.id),status:String(o.status),createdAt:new Date(o.created_at).toISOString(),total:Number(o.total),currency:String(o.currency),items:grouped.get(String(o.id))??[],returnWindowEndsAt:ret,warrantyEndsAt:war,alerts:buildAlerts({returnWindowEndsAt:ret,warrantyEndsAt:war,status:String(o.status)})};});
 return {customerId,purchaseCount:purchases.length,activeWarranties:purchases.filter(p=>p.warrantyEndsAt&&Date.parse(p.warrantyEndsAt)>Date.now()).length,returnWindows:purchases.filter(p=>p.returnWindowEndsAt&&Date.parse(p.returnWindowEndsAt)>Date.now()).length,attentionRequired:purchases.filter(p=>p.alerts.some(a=>a.severity!=='info')).length,purchases};
}
