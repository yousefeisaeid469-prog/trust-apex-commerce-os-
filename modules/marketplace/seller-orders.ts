import type { PoolClient } from 'pg';
import { query, withPgTransaction } from '../platform/db/postgres';

export type SellerOrderStatus = 'PLACED'|'ACCEPTED'|'PROCESSING'|'READY_FOR_HANDOFF'|'SHIPPED'|'DELIVERED'|'CANCELLED'|'REFUNDED'|'EXCEPTION';

function sellerNumber(orderId:string, merchantId:string){
  const a=orderId.replace(/-/g,'').slice(0,10).toUpperCase();
  const b=merchantId.replace(/-/g,'').slice(0,6).toUpperCase();
  return `SO-${a}-${b}`;
}

export async function createSellerOrdersTx(client:PoolClient,input:{orderId:string;currency:string;customerSubtotal:number;customerDiscount:number;lines:Array<{productId:string;offerId?:string;quantity:number;unitPrice:number}>;shipments?:Array<{merchantId:string;shipping:number}>;idempotencyPrefix:string}){
  const merchants=new Map<string,{subtotal:number;count:number}>();
  for(const line of input.lines){
    const r=await client.query<{merchant_id:string|null}>(`select coalesce(o.merchant_id,p.merchant_id) merchant_id from trust_products p left join trust_marketplace_offers o on o.id=$2 where p.id=$1`,[line.productId,line.offerId??null]);
    const merchantId=r.rows[0]?.merchant_id;
    if(!merchantId) continue;
    const g=merchants.get(String(merchantId))??{subtotal:0,count:0};
    g.subtotal += line.unitPrice*line.quantity; g.count += line.quantity; merchants.set(String(merchantId),g);
  }
  if(!merchants.size) return new Map<string,string>();
  const shipmentByMerchant=new Map<string,number>();
  for(const s of input.shipments??[]) shipmentByMerchant.set(String(s.merchantId),(shipmentByMerchant.get(String(s.merchantId))??0)+Number(s.shipping||0));
  const totalSubtotal=[...merchants.values()].reduce((n,g)=>n+g.subtotal,0);
  const ids=new Map<string,string>();
  for(const [merchantId,g] of merchants){
    const ratio=totalSubtotal>0?g.subtotal/totalSubtotal:0;
    const discount=Number((input.customerDiscount*ratio).toFixed(2));
    const shipping=Number((shipmentByMerchant.get(merchantId)??0).toFixed(2));
    const total=Math.max(0,Number((g.subtotal-discount+shipping).toFixed(2)));
    const key=`${input.idempotencyPrefix}:seller:${merchantId}`;
    const r=await client.query<{id:string}>(`insert into trust_seller_orders(order_id,merchant_id,seller_order_number,status,subtotal,discount,shipping,total,currency,item_count,idempotency_key) values($1,$2,$3,'PLACED',$4,$5,$6,$7,$8,$9,$10) on conflict(order_id,merchant_id) do update set subtotal=excluded.subtotal,discount=excluded.discount,shipping=excluded.shipping,total=excluded.total,item_count=excluded.item_count,updated_at=now() returning id`,[input.orderId,merchantId,sellerNumber(input.orderId,merchantId),g.subtotal,discount,shipping,total,input.currency.toUpperCase(),g.count,key]);
    ids.set(merchantId,String(r.rows[0].id));
    await client.query(`insert into trust_seller_order_events(seller_order_id,from_status,to_status,event_key,metadata_json) values($1,null,'PLACED',$2,$3::jsonb) on conflict(event_key) do nothing`,[r.rows[0].id,`${key}:event`,JSON.stringify({source:'checkout'})]);
  }
  return ids;
}

export async function listSellerOrders(merchantId:string,input?:{status?:string;limit?:number}){
  const limit=Math.min(Math.max(Number(input?.limit??50),1),200);
  return (await query<any>(`select so.id,so.order_id,so.seller_order_number,so.status,so.subtotal,so.discount,so.shipping,so.total,so.currency,so.item_count,so.created_at,so.updated_at,
    count(oe.id)::int event_count from trust_seller_orders so left join trust_seller_order_events oe on oe.seller_order_id=so.id
    where so.merchant_id=$1 and ($2::text is null or so.status=$2) group by so.id order by so.created_at desc limit $3`,[merchantId,input?.status??null,limit])).rows;
}

export async function getSellerOrderForMerchant(merchantId:string,id:string){
  const r=await query<any>(`select so.id,so.order_id,so.seller_order_number,so.status,so.subtotal,so.discount,so.shipping,so.total,so.currency,so.item_count,so.created_at,so.updated_at
    from trust_seller_orders so where so.id=$1 and so.merchant_id=$2`,[id,merchantId]);
  if(!r.rows[0]) throw new Error('SELLER_ORDER_NOT_FOUND');
  const [items,events,shipments]=await Promise.all([
    query<any>(`select oi.id,oi.product_id,oi.offer_id,oi.quantity,oi.unit_price,p.name,p.image from trust_order_items oi join trust_products p on p.id=oi.product_id where oi.seller_order_id=$1 order by oi.id`,[id]),
    query<any>(`select id,from_status,to_status,actor_id,metadata_json,created_at from trust_seller_order_events where seller_order_id=$1 order by created_at asc`,[id]),
    query<any>(`select id,merchant_id,destination_region,min_days,max_days,shipping_cost,fulfillment_cost,source,offer_ids from trust_order_shipments where order_id=$1 and merchant_id=$2 order by created_at asc`,[r.rows[0].order_id,merchantId])
  ]);
  return {...r.rows[0],items:items.rows,events:events.rows,shipments:shipments.rows};
}

const transitions:Record<SellerOrderStatus,SellerOrderStatus[]>={PLACED:['ACCEPTED','CANCELLED','EXCEPTION'],ACCEPTED:['PROCESSING','CANCELLED','EXCEPTION'],PROCESSING:['READY_FOR_HANDOFF','CANCELLED','EXCEPTION'],READY_FOR_HANDOFF:['SHIPPED','EXCEPTION'],SHIPPED:['DELIVERED','EXCEPTION'],DELIVERED:['REFUNDED'],CANCELLED:[],REFUNDED:[],EXCEPTION:['PROCESSING','CANCELLED']};
export async function transitionSellerOrder(input:{merchantId:string;sellerOrderId:string;to:SellerOrderStatus;actorId?:string;idempotencyKey:string}){
  return withPgTransaction(async client=>{
    await client.query(`select pg_advisory_xact_lock(hashtext($1))`,[`seller-order:${input.sellerOrderId}:${input.idempotencyKey}`]);
    const row=(await client.query<any>(`select id,status from trust_seller_orders where id=$1 and merchant_id=$2 for update`,[input.sellerOrderId,input.merchantId])).rows[0];
    if(!row) throw new Error('SELLER_ORDER_NOT_FOUND');
    const from=String(row.status) as SellerOrderStatus;
    if(from===input.to) return {id:String(row.id),from,to:from,replayed:true};
    if(!transitions[from]?.includes(input.to)) throw new Error('INVALID_SELLER_ORDER_TRANSITION');
    if(input.to==='DELIVERED'){
      const fulfillment=(await client.query<any>(`select f.status,s.status shipment_status from trust_marketplace_fulfillment_orders f left join trust_shipments s on s.id=f.shipment_id where f.seller_order_id=$1 order by f.created_at desc limit 1 for update`,[input.sellerOrderId])).rows[0];
      if(!fulfillment || fulfillment.status!=='DELIVERED' || fulfillment.shipment_status!=='DELIVERED') throw new Error('SELLER_ORDER_FULFILLMENT_NOT_DELIVERED');
    }
    await client.query(`update trust_seller_orders set status=$1,updated_at=now() where id=$2`,[input.to,input.sellerOrderId]);
    await client.query(`insert into trust_seller_order_events(seller_order_id,from_status,to_status,actor_id,event_key,metadata_json) values($1,$2,$3,$4,$5,'{}'::jsonb) on conflict(event_key) do nothing`,[input.sellerOrderId,from,input.to,input.actorId??null,`transition:${input.idempotencyKey}`]);
    return {id:String(row.id),from,to:input.to,replayed:false};
  });
}

export async function listCustomerSellerOrders(orderId:string,customerId?:string){
  const r=await query<any>(`select so.id,so.order_id,so.merchant_id,mp.store_name seller_name,so.seller_order_number,so.status,so.subtotal,so.discount,so.shipping,so.total,so.currency,so.item_count,so.created_at,so.updated_at
    from trust_seller_orders so join trust_orders o on o.id=so.order_id join trust_merchant_profiles mp on mp.id=so.merchant_id
    where so.order_id=$1 and ($2::uuid is null or o.customer_id=$2) order by so.created_at asc`,[orderId,customerId??null]);
  return r.rows;
}
