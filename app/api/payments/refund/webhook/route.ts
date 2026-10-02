import { NextRequest, NextResponse } from 'next/server';
import { applyRefundEvent, verifyWebhookSignature } from '../../../../../modules/commerce/payments/orchestrator';
import { withPgTransaction } from '../../../../../modules/platform/db/postgres';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const requestId=req.headers.get('x-request-id')?.trim()||crypto.randomUUID();
  const raw=await req.text(); const signature=req.headers.get('x-trust-signature')??''; const secret=process.env.TRUST_PAYMENT_WEBHOOK_SECRET ?? process.env.TRUST_WEBHOOK_SECRET ?? '';
  if(!secret||!verifyWebhookSignature(raw,signature,secret)) return NextResponse.json({ok:false,error:'INVALID_WEBHOOK_SIGNATURE',requestId},{status:401,headers:{'x-request-id':requestId}});
  try{const b=JSON.parse(raw); if(!b?.provider||!b?.eventId||!b?.refundId||!['succeeded','failed'].includes(b?.status)) return NextResponse.json({ok:false,error:'INVALID_REFUND_WEBHOOK',requestId},{status:400,headers:{'x-request-id':requestId}});
    const result=await withPgTransaction(client=>applyRefundEvent({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)},{provider:String(b.provider),eventId:String(b.eventId),refundId:String(b.refundId),status:b.status,providerReference:typeof b.providerReference==='string'?b.providerReference:undefined,payload:b}));
    return NextResponse.json({...result,requestId},{headers:{'Cache-Control':'no-store','x-request-id':requestId}});
  }catch(e){const status=e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400;return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REFUND_WEBHOOK_ERROR',requestId},{status,headers:{'x-request-id':requestId}});}
}
