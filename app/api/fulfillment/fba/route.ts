import {NextRequest,NextResponse} from 'next/server';
import {withPgTransaction} from '@/modules/platform/db/postgres';
import {getCurrentUser} from '@/modules/platform/auth/current-user';
import {getMerchantByUserId} from '@/modules/merchants/core/store';
import {enrollFulfillmentProgramTx,reserveFulfillmentInventoryTx,dispatchFulfillmentOrderTx} from '@/modules/marketplace/fba-runtime';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
 const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
 try{const b=await req.json();let result;
  if(b.action==='enroll') result=await withPgTransaction(tx=>enrollFulfillmentProgramTx(tx,{merchantId:merchant.id,programId:String(b.programId??''),serviceLevel:b.serviceLevel,idempotencyKey:key}));
  else if(b.action==='reserve') result=await withPgTransaction(tx=>reserveFulfillmentInventoryTx(tx,{fulfillmentOrderId:String(b.fulfillmentOrderId??''),merchantId:merchant.id,locationId:String(b.locationId??''),productId:String(b.productId??''),offerId:b.offerId?String(b.offerId):undefined,quantity:Number(b.quantity),idempotencyKey:key}));
  else if(b.action==='dispatch') result=await withPgTransaction(tx=>dispatchFulfillmentOrderTx(tx,{fulfillmentOrderId:String(b.fulfillmentOrderId??''),merchantId:merchant.id,idempotencyKey:key}));
  else return NextResponse.json({ok:false,error:'UNKNOWN_FBA_ACTION'},{status:400});
  return NextResponse.json({ok:true,surfaceStatus:'LIVE',result},{status:result?.replay?200:201});
 }catch(e){const m=e instanceof Error?e.message:'FBA_OPERATION_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m==='DATABASE_NOT_CONFIGURED'?503:400});}
}
