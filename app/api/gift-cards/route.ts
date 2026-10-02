import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { issueGiftCard, listGiftCards, redeemGiftCard } from '../../../modules/platform/v319';
export const dynamic='force-dynamic';
export async function GET(req:Request){
  const user=await getCurrentUser(req as any); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{return NextResponse.json({ok:true,surfaceStatus:'LIVE',giftCards:await listGiftCards(user.id)});}catch(e){const code=e instanceof Error?e.message:'GIFT_CARD_QUERY_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:400});}
}
export async function POST(req:Request){
  const user=await getCurrentUser(req as any); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{
    const body=await req.json();
    if(body?.action==='redeem') return NextResponse.json({ok:true,surfaceStatus:'LIVE',...(await redeemGiftCard({code:String(body.code||''),orderId:body.orderId?String(body.orderId):undefined,amount:Number(body.amount),actorId:user.id,idempotencyKey:String(body.idempotencyKey||'')}))});
    return NextResponse.json({ok:true,surfaceStatus:'LIVE',giftCard:await issueGiftCard({ownerId:user.id,amount:Number(body?.amount),currency:body?.currency,recipientEmail:body?.recipientEmail,expiresAt:body?.expiresAt})},{status:201});
  }catch(e){const code=e instanceof Error?e.message:'GIFT_CARD_OPERATION_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:400});}
}
