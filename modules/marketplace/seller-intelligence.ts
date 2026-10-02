import { query } from '../platform/db/postgres';
import type { PoolClient } from 'pg';
import { calculateSellerTrust, type SellerPerformance, type SellerTrust } from './seller-intelligence-score';

const n=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;

function mapPerformance(r:any):SellerPerformance {
  const ratingsCount=n(r.ratings_count);
  return {merchantId:String(r.merchant_id),ordersTotal:n(r.orders_total),ordersOnTime:n(r.orders_on_time),cancellations:n(r.cancellations),returns:n(r.returns),defects:n(r.defects),stockouts:n(r.stockouts),ratingsCount,ratingAverage:ratingsCount>0?n(r.rating_sum)/ratingsCount:null};
}

export async function getSellerTrust(merchantId:string):Promise<SellerTrust>{
  const r=await query(`select merchant_id,orders_total,orders_on_time,cancellations,returns,defects,stockouts,ratings_count,rating_sum from trust_marketplace_seller_performance where merchant_id=$1`,[merchantId]);
  if(!r.rows[0]) return calculateSellerTrust({merchantId,ordersTotal:0,ordersOnTime:0,cancellations:0,returns:0,defects:0,stockouts:0,ratingsCount:0,ratingAverage:null});
  return calculateSellerTrust(mapPerformance(r.rows[0]));
}

export async function getSellerTrustBatch(merchantIds:string[]):Promise<Map<string,SellerTrust>>{
  const ids=[...new Set(merchantIds.map(String).filter(Boolean))];
  if(!ids.length)return new Map();
  const r=await query(`select merchant_id,orders_total,orders_on_time,cancellations,returns,defects,stockouts,ratings_count,rating_sum from trust_marketplace_seller_performance where merchant_id = any($1::uuid[])`,[ids]);
  const out=new Map<string,SellerTrust>();
  for(const row of r.rows)out.set(String(row.merchant_id),calculateSellerTrust(mapPerformance(row)));
  return out;
}

export async function recordSellerOrderAcceptedTx(client:PoolClient, merchantId:string, orderId:string, offerId?:string){
  const key=`order-accepted:${orderId}:${merchantId}`;
  const inserted=await client.query(`insert into trust_marketplace_seller_performance_events(merchant_id,event_type,order_id,offer_id,idempotency_key) values($1,'ORDER_ACCEPTED',$2,$3,$4) on conflict(merchant_id,idempotency_key) do nothing returning id`,[merchantId,orderId,offerId??null,key]);
  if(!inserted.rows[0])return false;
  await client.query(`insert into trust_marketplace_seller_performance(merchant_id,orders_total,updated_at,last_event_at) values($1,1,now(),now()) on conflict(merchant_id) do update set orders_total=trust_marketplace_seller_performance.orders_total+1,updated_at=now(),last_event_at=now()`,[merchantId]);
  return true;
}
