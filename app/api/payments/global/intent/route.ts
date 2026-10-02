import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, AuthRequiredError } from '../../../../../modules/platform/auth/current-user';
import { withPgTransaction, query } from '../../../../../modules/platform/db/postgres';
import { createGlobalPaymentIntent } from '../../../../../modules/commerce/payments/global-runtime';
import { getPaymentProviderReadiness, requireConfiguredPaymentProvider } from '../../../../../modules/platform/payments/provider-gate';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  try{
    const user=await getCurrentUser(req); if(!user) throw new AuthRequiredError();
    const key=req.headers.get('idempotency-key')?.trim(); if(!key) return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
    const b=await req.json().catch(()=>({}));
    const orderId=typeof b?.orderId==='string'?b.orderId:'';
    const provider=typeof b?.provider==='string'?b.provider.trim():'';
    const method=['card','cod','wallet','bank_transfer'].includes(b?.paymentMethod)?b.paymentMethod:'card';
    if(!orderId||!provider) return NextResponse.json({ok:false,error:'INVALID_GLOBAL_PAYMENT'},{status:400});
    const readiness=getPaymentProviderReadiness();
    if(!readiness.configured) return NextResponse.json({ok:false,surfaceStatus:'PROVIDER_REQUIRED',error:readiness.reason,provider:readiness.provider},{status:503});
    requireConfiguredPaymentProvider(provider);
    const result=await createGlobalPaymentIntent({transaction:async work=>withPgTransaction(client=>work(client)),query:(sql,params)=>query(sql,params)},{orderId,customerId:user.id,provider,method,idempotencyKey:key,paymentIntentId:typeof b?.paymentIntentId==='string'?b.paymentIntentId:undefined});
    return NextResponse.json({ok:true,version:'V299.0.0',surfaceStatus:'LIVE',payment:result},{status:result.replay?200:201,headers:{'Cache-Control':'no-store'}});
  }catch(e){
    const m=e instanceof Error?e.message:'GLOBAL_PAYMENT_ERROR';
    const status=e instanceof AuthRequiredError?401:['GLOBAL_PAYMENT_PROVIDER_NOT_AVAILABLE','GLOBAL_PAYMENT_METHOD_MISMATCH','GLOBAL_PAYMENT_REQUIRES_GLOBAL_ORDER','IDEMPOTENCY_KEY_REUSED'].includes(m)?409:['PAYMENT_PROVIDER_NOT_CONFIGURED','PAYMENT_PROVIDER_SECRET_NOT_CONFIGURED','PAYMENT_PROVIDER_BASE_URL_NOT_CONFIGURED','DATABASE_NOT_CONFIGURED'].includes(m)?503:400;
    return NextResponse.json({ok:false,version:'V299.0.0',error:m},{status,headers:{'Cache-Control':'no-store'}});
  }
}
