import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '../../../modules/commerce/payments/orchestrator';
import { withPgTransaction } from '../../../modules/platform/db/postgres';
import { getCurrentUser, AuthRequiredError } from '../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  try{
    const user=await getCurrentUser(req); if(!user) throw new AuthRequiredError();
    const key=req.headers.get('idempotency-key')?.trim(); if(!key) return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
    const b=await req.json();
    if(!b?.orderId||!b?.provider) return NextResponse.json({ok:false,error:'INVALID_PAYMENT'},{status:400});
    const result=await withPgTransaction(client=>createPaymentIntent({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)}, {orderId:String(b.orderId),customerId:user.id,provider:String(b.provider),currency:'EGP',idempotencyKey:key,paymentIntentId:typeof b.paymentIntentId==='string'?b.paymentIntentId:undefined}));
    return NextResponse.json({ok:true,payment:result},{headers:{'Cache-Control':'no-store'}});
  }catch(e){ const status=e instanceof AuthRequiredError?401: e instanceof Error && e.message==='DATABASE_NOT_CONFIGURED'?503:400; return NextResponse.json({ok:false,error:e instanceof Error?e.message:'PAYMENT_ERROR'},{status,headers:{'Cache-Control':'no-store'}}); }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    surfaceStatus: 'PROVIDER_REQUIRED',
    provider: null,
    capabilities: { intentCreation: false, webhookVerification: Boolean(process.env.TRUST_PAYMENT_WEBHOOK_SECRET || process.env.TRUST_WEBHOOK_SECRET) },
    message: 'Payment infrastructure exists, but no production payment provider is configured in this build.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
