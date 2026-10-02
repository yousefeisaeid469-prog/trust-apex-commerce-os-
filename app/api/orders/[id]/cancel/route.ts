import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { databaseConfigured, withPgTransaction } from '../../../../../modules/platform/db/postgres';
import { reversePromotionApplicationsTx } from '../../../../../modules/marketplace/promotions';
import { releaseOrderReservationsForCancellationTx } from '../../../../../modules/commerce/inventory/reservations';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:{id:string}}){
  if(!databaseConfigured()) return NextResponse.json({ok:false,error:'DATABASE_NOT_CONFIGURED'},{status:503});
  const user=await getCurrentUser(req); if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try { const result=await withPgTransaction(async client=>{
    await client.query(`select pg_advisory_xact_lock(hashtext($1))`,[`order.cancel:${params.id}`]);
    const order=(await client.query(`select id,customer_id,status from trust_orders where id=$1 for update`,[params.id])).rows[0];
    if(!order) throw new Error('ORDER_NOT_FOUND'); if(order.customer_id!==user.id && !['admin','support','operations'].includes(user.role)) throw new Error('ORDER_ACCESS_DENIED');
    if(!['pending','confirmed'].includes(order.status)) throw new Error('ORDER_NOT_CANCELLABLE');
    await releaseOrderReservationsForCancellationTx(client, params.id, 'ORDER_CANCELLED');
    await reversePromotionApplicationsTx(client,{orderId:params.id,idempotencyKey:`cancel:${params.id}`});
    await client.query(`update trust_orders set status='cancelled',updated_at=now() where id=$1`,[params.id]);
    await client.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,'cancelled','customer','Cancelled by order owner')`,[params.id,order.status]);
    if(order.customer_id){const {queueOrderStatusNotificationsTx}=await import('../../../../../modules/platform/notifications-3');await queueOrderStatusNotificationsTx(client,{orderId:params.id,customerId:order.customer_id,status:'cancelled'});}
    await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('order.status_changed',$1,$2::jsonb)`,[params.id,JSON.stringify({from:order.status,to:'cancelled',source:'customer'})]);
    return {id:params.id,status:'cancelled'};
  });
  return NextResponse.json({ok:true,order:result},{headers:{'Cache-Control':'no-store'}});
  } catch(e){const msg=e instanceof Error?e.message:'ORDER_CANCEL_FAILED'; const status=['ORDER_NOT_FOUND'].includes(msg)?404:['ORDER_ACCESS_DENIED'].includes(msg)?403:['ORDER_NOT_CANCELLABLE'].includes(msg)?409:400; return NextResponse.json({ok:false,error:msg},{status});}
}
