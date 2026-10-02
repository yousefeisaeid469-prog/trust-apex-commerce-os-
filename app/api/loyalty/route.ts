import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { getLoyaltyAccount } from '../../../modules/marketplace/customer-retention';
import { earnDeliveredOrderPoints } from '../../../modules/platform/v324/customer-commerce';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{return NextResponse.json({ok:true,feature:'loyalty',surfaceStatus:'LIVE',account:await getLoyaltyAccount(u.id)},{headers:{'Cache-Control':'no-store'}})}
  catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'LOYALTY_ERROR'},{status:400})}
}
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{const b=await req.json();if(String(b?.action||'').toUpperCase()!=='EARN_ORDER')return NextResponse.json({ok:false,error:'UNKNOWN_LOYALTY_ACTION'},{status:400});const key=req.headers.get('idempotency-key')?.trim()||String(b?.idempotencyKey||'').trim();if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});const result=await earnDeliveredOrderPoints({customerId:u.id,orderId:String(b?.orderId||''),idempotencyKey:key});return NextResponse.json({ok:true,feature:'loyalty',surfaceStatus:'LIVE',result},{status:result.replay?200:201});}
  catch(e){const m=e instanceof Error?e.message:'LOYALTY_EARN_FAILED';return NextResponse.json({ok:false,error:m},{status:m==='ORDER_NOT_FOUND'?404:400})}
}
