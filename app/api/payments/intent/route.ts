import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '../../../../modules/commerce/payments/orchestrator';
import { withPgTransaction } from '../../../../modules/platform/db/postgres';
import { getCurrentUser, AuthRequiredError } from '../../../../modules/platform/auth/current-user';
import { getPaymentProviderReadiness, requireConfiguredPaymentProvider } from '../../../../modules/platform/payments/provider-gate';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:NextRequest){
  try {
    const user=await getCurrentUser(req); if(!user) throw new AuthRequiredError();
    const key=req.headers.get('idempotency-key')?.trim(); if(!key) return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
    const b=await req.json();
    const provider=typeof b?.provider==='string'?b.provider.trim():'';
    if(!b?.orderId||!provider) return NextResponse.json({ok:false,error:'INVALID_PAYMENT'},{status:400});
    const readiness=getPaymentProviderReadiness();
    if(!readiness.configured) return NextResponse.json({ok:false,surfaceStatus:'PROVIDER_REQUIRED',error:readiness.reason,provider:readiness.provider},{status:503,headers:{'Cache-Control':'no-store'}});
    requireConfiguredPaymentProvider(provider);
    const result=await withPgTransaction(client=>createPaymentIntent({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)}, {orderId:String(b.orderId),customerId:user.id,provider,currency:'EGP',idempotencyKey:key,paymentIntentId:typeof b.paymentIntentId==='string'?b.paymentIntentId:undefined}));
    return NextResponse.json({ok:true,payment:result,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
  } catch(e){
    const status=e instanceof AuthRequiredError?401:e instanceof Error&&['DATABASE_NOT_CONFIGURED','PAYMENT_PROVIDER_NOT_CONFIGURED','PAYMENT_PROVIDER_SECRET_NOT_CONFIGURED','PAYMENT_PROVIDER_BASE_URL_NOT_CONFIGURED'].includes(e.message)?503:400;
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:'PAYMENT_ERROR'},{status,headers:{'Cache-Control':'no-store'}});
  }
}

export async function GET(){
  const readiness=getPaymentProviderReadiness();
  return NextResponse.json({ok:true,surfaceStatus:readiness.configured?'LIVE':'PROVIDER_REQUIRED',provider:readiness.provider,configured:readiness.configured,capabilities:{intentCreation:readiness.configured,webhookVerification:Boolean(process.env.TRUST_PAYMENT_WEBHOOK_SECRET||process.env.TRUST_WEBHOOK_SECRET)}} ,{headers:{'Cache-Control':'no-store'}});
}
