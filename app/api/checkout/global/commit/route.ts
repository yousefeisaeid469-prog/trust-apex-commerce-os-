import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { withPgTransaction } from '../../../../../modules/platform/db/postgres';
import { commitCanonicalGlobalCheckout } from '../../../../../modules/commerce/core/canonical-commerce-kernel';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{
    const body=await req.json().catch(()=>({}));
    const quoteId=typeof body?.quoteId==='string'?body.quoteId:'';
    const paymentMethod=body?.paymentMethod==='cod'?'cod':'card';
    if(!quoteId) return NextResponse.json({ok:false,error:'QUOTE_ID_REQUIRED'},{status:400});
    const key=req.headers.get('idempotency-key')?.trim()||`global-checkout:${quoteId}`;
    const order=await withPgTransaction(client=>commitCanonicalGlobalCheckout(client,{customerId:user.id,quoteId,idempotencyKey:key,paymentMethod}));
    return NextResponse.json({ok:true,surfaceStatus:'LIVE',version:'V298.0.0',order},{status:order.idempotentReplay?200:201,headers:{'Cache-Control':'no-store'}});
  }catch(e){
    const m=e instanceof Error?e.message:'GLOBAL_CHECKOUT_FAILED';
    const status=['GLOBAL_QUOTE_EXPIRED_OR_NOT_FOUND','GLOBAL_QUOTE_EMPTY','PAYMENT_METHOD_NOT_AVAILABLE','PRODUCT_NOT_AVAILABLE','OFFER_NOT_AVAILABLE','GLOBAL_QUOTE_PRICE_CHANGED','INSUFFICIENT_STOCK','INSUFFICIENT_OFFER_STOCK','IDEMPOTENCY_KEY_REUSED'].includes(m)?409:400;
    return NextResponse.json({ok:false,version:'V298.0.0',error:m},{status,headers:{'Cache-Control':'no-store'}});
  }
}
