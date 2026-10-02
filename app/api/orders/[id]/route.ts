import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../modules/platform/db/postgres';
import { getCurrentUser, AuthRequiredError } from '../../../../modules/platform/auth/current-user';
import { buildOrderTimeline, getOrderActions } from '../../../../modules/platform/order-experience';
import { listShipmentsForOrder } from '../../../../modules/platform/fulfillment-tracking-3';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:{id:string}}){
  try { const user=await getCurrentUser(req); if(!user) throw new AuthRequiredError();
    const order=(await query(`select id,customer_id,status,subtotal,discount,shipping,total,currency,payment_method,created_at,updated_at from trust_orders where id=$1`,[params.id])).rows[0];
    if(!order) return NextResponse.json({ok:false,error:'ORDER_NOT_FOUND'},{status:404});
    const privileged=['admin','support','operations'].includes(user.role); if(!privileged && order.customer_id!==user.id) return NextResponse.json({ok:false,error:'ORDER_ACCESS_DENIED'},{status:403});
    const [items,payments,history,shipments]=await Promise.all([
      query(`select oi.product_id,oi.quantity,oi.unit_price,p.name,p.image from trust_order_items oi join trust_products p on p.id=oi.product_id where oi.order_id=$1 order by oi.created_at asc`,[params.id]),
      query(`select id,provider,payment_intent_id,amount,currency,status,created_at,updated_at from trust_payments where order_id=$1 order by created_at desc`,[params.id]),
      query(`select from_status,to_status,source,note,created_at from trust_order_status_history where order_id=$1 order by created_at asc`,[params.id]),
      listShipmentsForOrder(params.id)
    ]);
    return NextResponse.json({ok:true,order:{id:order.id,status:order.status,subtotal:Number(order.subtotal),discount:Number(order.discount),shipping:Number(order.shipping),total:Number(order.total),currency:order.currency,paymentMethod:order.payment_method,createdAt:order.created_at,updatedAt:order.updated_at},items:items.rows.map((r:any)=>({...r,quantity:Number(r.quantity),unitPrice:Number(r.unit_price)})),payments:payments.rows,timeline:buildOrderTimeline(history.rows.map((r:any)=>({status:r.to_status,createdAt:r.created_at})),order.status),actions:getOrderActions(order.status),shipments},{headers:{'Cache-Control':'no-store'}});
  } catch(e) { const status=e instanceof AuthRequiredError?401:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400; return NextResponse.json({ok:false,error:e instanceof Error?e.message:'ORDER_ERROR'},{status}); }
}
