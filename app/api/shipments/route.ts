import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/modules/platform/auth/current-user';
import { listShipmentsForOrder } from '@/modules/platform/fulfillment-tracking-3';
import { planShipment } from '@/modules/platform/fulfillment-execution/core';
import { query } from '@/modules/platform/db/postgres';
export const dynamic='force-dynamic'; export const runtime='nodejs';
const privileged=['admin','support','operations'];
export async function POST(req:NextRequest){
  const user=await getCurrentUser(req); if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401});
  if(!privileged.includes(user.role)) return NextResponse.json({ok:false,error:'PRIVILEGED_ACCESS_REQUIRED',surfaceStatus:'ERROR'},{status:403});
  try { const b=await req.json(); const shipment=await planShipment({orderId:String(b.orderId??''),carrier:String(b.carrier??''),service:String(b.service??''),warehouseId:b.warehouseId?String(b.warehouseId):undefined,destination:b.destination,etaAt:b.etaAt}); return NextResponse.json({ok:true,surfaceStatus:'LIVE',shipment},{status:201,headers:{'Cache-Control':'no-store'}}); }
  catch(e){const message=e instanceof Error?e.message:'SHIPMENT_CREATE_ERROR'; const status=message==='DATABASE_NOT_CONFIGURED'?503:400; return NextResponse.json({ok:false,error:message,surfaceStatus:'ERROR'},{status});}
}
export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401});
  const orderId=new URL(req.url).searchParams.get('orderId');
  if(!orderId) return NextResponse.json({ok:false,error:'ORDER_ID_REQUIRED',surfaceStatus:'ERROR'},{status:400});
  try { const order=(await query(`select customer_id from trust_orders where id=$1`,[orderId])).rows[0]; if(!order)return NextResponse.json({ok:false,error:'ORDER_NOT_FOUND',surfaceStatus:'ERROR'},{status:404}); if(order.customer_id!==user.id&&!privileged.includes(user.role))return NextResponse.json({ok:false,error:'ORDER_ACCESS_DENIED',surfaceStatus:'ERROR'},{status:403}); return NextResponse.json({ok:true,surfaceStatus:'LIVE',shipments:await listShipmentsForOrder(orderId)},{headers:{'Cache-Control':'no-store'}}); }
  catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'SHIPMENT_LIST_ERROR',surfaceStatus:'ERROR'},{status:400});}
}
