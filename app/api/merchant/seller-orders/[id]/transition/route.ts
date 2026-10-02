import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../../modules/merchants/core/store';
import { transitionSellerOrder,type SellerOrderStatus } from '../../../../../../modules/marketplace/seller-orders';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:{id:string}}){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const m=await getMerchantByUserId(u.id); if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
 const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
 const body=await req.json().catch(()=>({})); const to=String(body.to??'') as SellerOrderStatus;
 try{return NextResponse.json({ok:true,result:await transitionSellerOrder({merchantId:m.id,sellerOrderId:params.id,to,actorId:u.id,idempotencyKey:key})})}catch(e:any){const msg=e?.message??'SELLER_ORDER_TRANSITION_FAILED'; return NextResponse.json({ok:false,error:msg},{status:msg==='SELLER_ORDER_NOT_FOUND'?404:409});}
}
