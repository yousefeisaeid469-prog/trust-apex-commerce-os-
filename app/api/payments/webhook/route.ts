import { NextRequest, NextResponse } from 'next/server';
import { applyPaymentEvent } from '../../../../modules/commerce/payments/orchestrator';
import { withPgTransaction } from '../../../../modules/platform/db/postgres';
import { ingestWebhook, markWebhook } from '../../../../modules/platform/webhooks/inbox';
import { verifyWebhookSignature } from '../../../../modules/commerce/payments/orchestrator';
import { requireConfiguredPaymentProvider } from '../../../../modules/platform/payments/provider-gate';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:NextRequest){
  const raw=await req.text();
  const signature=req.headers.get('x-trust-signature')??'';
  const secret=process.env.TRUST_PAYMENT_WEBHOOK_SECRET ?? process.env.TRUST_WEBHOOK_SECRET ?? '';
  if(!secret||!verifyWebhookSignature(raw,signature,secret)) return NextResponse.json({ok:false,error:'INVALID_WEBHOOK_SIGNATURE'},{status:401});
  let body: any;
  try { body=JSON.parse(raw); } catch { return NextResponse.json({ok:false,error:'INVALID_WEBHOOK_JSON'},{status:400}); }
  if(!body?.provider||!body?.eventId||!body?.eventType||!body?.paymentIntentId||!body?.status) return NextResponse.json({ok:false,error:'INVALID_WEBHOOK'},{status:400});
  try { requireConfiguredPaymentProvider(String(body.provider)); } catch(e) { return NextResponse.json({ok:false,surfaceStatus:'PROVIDER_REQUIRED',error:e instanceof Error?e.message:'PAYMENT_PROVIDER_NOT_CONFIGURED'},{status:503,headers:{'Cache-Control':'no-store'}}); }

  let inboxId='';
  try {
    const ingested=await withPgTransaction(client=>ingestWebhook({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)}, {provider:String(body.provider),eventId:String(body.eventId),eventType:String(body.eventType),payload:body,signature}));
    inboxId=ingested.id;
    if(ingested.duplicate) return NextResponse.json({ok:true,duplicate:true,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});

    const result=await withPgTransaction(client=>applyPaymentEvent({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)}, {provider:String(body.provider),eventId:String(body.eventId),paymentIntentId:String(body.paymentIntentId),status:body.status,payload:body,webhookInboxId:inboxId}));
    await withPgTransaction(client=>markWebhook({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)},inboxId,'processed'));
    return NextResponse.json({...result,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
  } catch(e){
    if(inboxId){ try { await withPgTransaction(client=>markWebhook({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)},inboxId,'failed',e instanceof Error?e.message:'WEBHOOK_ERROR')); } catch {} }
    const status=e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400;
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:'WEBHOOK_ERROR'},{status,headers:{'Cache-Control':'no-store'}});
  }
}
