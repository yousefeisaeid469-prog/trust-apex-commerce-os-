import {NextRequest,NextResponse} from 'next/server';
import {withPgTransaction,query} from '@/modules/platform/db/postgres';
import {getCurrentUser} from '@/modules/platform/auth/current-user';
import {getMerchantByUserId} from '@/modules/merchants/core/store';
import {createFulfillmentOrderTx,bindFulfillmentShipmentTx,transitionFulfillmentOrderTx,receiveInventoryTx} from '@/modules/marketplace/fulfillment-runtime';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  const status=new URL(req.url).searchParams.get('status');
  const rows=await query(`select * from trust_marketplace_fulfillment_orders where merchant_id=$1 ${status?"and status=$2":''} order by updated_at desc limit 100`,status?[merchant.id,status]:[merchant.id]);
  return NextResponse.json({ok:true,surfaceStatus:'LIVE',fulfillmentOrders:rows.rows},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{const b=await req.json(); let result;
    if(b.action==='create') result=await withPgTransaction(tx=>createFulfillmentOrderTx(tx,{orderShipmentId:String(b.orderShipmentId??''),merchantId:merchant.id,programCode:b.programCode,idempotencyKey:key}));
    else if(b.action==='bind_shipment') result=await withPgTransaction(tx=>bindFulfillmentShipmentTx(tx,{fulfillmentOrderId:String(b.fulfillmentOrderId??''),merchantId:merchant.id,shipmentId:String(b.shipmentId??''),idempotencyKey:key}));
    else if(b.action==='transition') result=await withPgTransaction(tx=>transitionFulfillmentOrderTx(tx,{fulfillmentOrderId:String(b.fulfillmentOrderId??''),merchantId:merchant.id,toStatus:String(b.toStatus??''),actorId:u.id,idempotencyKey:key}));
    else if(b.action==='receive_inventory') result=await withPgTransaction(tx=>receiveInventoryTx(tx,{locationId:String(b.locationId??''),productId:String(b.productId??''),offerId:b.offerId?String(b.offerId):undefined,quantity:Number(b.quantity),referenceKey:key,note:b.note?String(b.note):undefined}));
    else return NextResponse.json({ok:false,error:'UNKNOWN_FULFILLMENT_ACTION'},{status:400});
    return NextResponse.json({ok:true,surfaceStatus:'LIVE',result},{status:result?.replay?200:201});
  }catch(e){const m=e instanceof Error?e.message:'FULFILLMENT_OPERATION_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m==='DATABASE_NOT_CONFIGURED'?503:400});}
}
