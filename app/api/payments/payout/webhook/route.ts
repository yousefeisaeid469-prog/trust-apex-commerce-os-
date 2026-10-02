import {NextRequest,NextResponse} from 'next/server';
import {withPgTransaction} from '../../../../../modules/platform/db/postgres';
import {webhookVerifier} from '../../../../../modules/platform/provider-reconciliation';
import {applyPayoutProviderWebhookTx} from '../../../../../modules/marketplace/financial-loop';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function providerSecret(provider:string){
  const key=provider.replace(/[^A-Za-z0-9]/g,'_').toUpperCase();
  return process.env[`PAYMENT_${key}_WEBHOOK_SECRET`] ?? process.env.PROVIDER_WEBHOOK_SECRET;
}

export async function POST(req:NextRequest){
  const provider=req.headers.get('x-provider')?.trim()||'';
  const signature=req.headers.get('x-provider-signature')||'';
  const timestamp=req.headers.get('x-provider-timestamp')||'';
  const secret=providerSecret(provider);
  if(!provider||!signature||!timestamp||!secret)return NextResponse.json({ok:false,error:'WEBHOOK_AUTH_REQUIRED'},{status:401});
  const raw=await req.text();
  if(!webhookVerifier.verify(raw,signature,secret,timestamp))return NextResponse.json({ok:false,error:'WEBHOOK_SIGNATURE_INVALID'},{status:401});
  try{
    const b=JSON.parse(raw);
    const payload=(b.payload&&typeof b.payload==='object')?b.payload:{};
    const value=(k:string)=>b[k]??payload[k];
    const status=String(value('status')||'').toUpperCase();
    if(!['PROCESSING','PAID','FAILED','HELD','REVERSED'].includes(status))throw new Error('INVALID_PAYOUT_STATUS');
    const payoutId=String(value('payoutId')||value('payout_id')||'');
    const eventId=String(b.eventId||b.event_id||'');
    const amount=Number(value('amount'));
    const currency=String(value('currency')||'');
    const providerReference=value('providerReference')??value('provider_reference')??value('reference');
    if(!payoutId||!eventId)throw new Error('PAYOUT_EVENT_ID_REQUIRED');
    if(!Number.isFinite(amount)||amount<=0)throw new Error('PAYOUT_AMOUNT_REQUIRED');
    if(!currency)throw new Error('PAYOUT_CURRENCY_REQUIRED');
    const result=await withPgTransaction(tx=>applyPayoutProviderWebhookTx(tx,{payoutId,provider,providerEventId:eventId,status:status as any,providerReference:providerReference==null?undefined:String(providerReference),amount,currency,failureCode:value('failureCode')==null?undefined:String(value('failureCode')),payload:b,idempotencyKey:`payout-webhook:${provider}:${eventId}`}));
    return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201,headers:{'Cache-Control':'no-store'}});
  }catch(e){const m=e instanceof Error?e.message:'PAYOUT_WEBHOOK_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m.includes('CONFLICT')||m.startsWith('PAYOUT_')?409:400});}
}
