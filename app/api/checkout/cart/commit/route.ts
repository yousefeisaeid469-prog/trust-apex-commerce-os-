import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { cartSummary, clearCartIfMatches } from '../../../../../modules/commerce/cart/store';
import { createQuote, placeOrderFromQuote } from '../../../../../modules/commerce/core/engine';
import { createPaymentIntent } from '../../../../../modules/commerce/payments/orchestrator';
import { getPaymentProviderReadiness } from '../../../../../modules/platform/payments/provider-gate';
import { withPgTransaction } from '../../../../../modules/platform/db/postgres';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try {
    const body=await req.json().catch(()=>({}));
    const summary=await cartSummary(user.id);
    if(summary.cart.items.length===0) return NextResponse.json({ok:false,error:'CART_EMPTY'},{status:400});
    if(summary.invalidLines>0 || summary.stockWarnings.length>0) return NextResponse.json({ok:false,error:'CART_REQUIRES_REFRESH',invalidLines:summary.invalidLines,stockWarnings:summary.stockWarnings},{status:409});
    const destinationRegion=typeof body?.destinationRegion==='string'&&body.destinationRegion.trim()?body.destinationRegion.trim():'GLOBAL';
    const discountCode=typeof body?.discountCode==='string'?body.discountCode:undefined;
    const paymentMethod=body?.paymentMethod==='card'?'card':'cod';
    const readiness=getPaymentProviderReadiness();
    if(paymentMethod==='card' && !readiness.configured) return NextResponse.json({ok:false,surfaceStatus:'PROVIDER_REQUIRED',error:readiness.reason,provider:readiness.provider},{status:503,headers:{'Cache-Control':'no-store'}});
    const quote=await createQuote(summary.cart.items,10*60_000,discountCode,destinationRegion,user.id);
    const key=req.headers.get('idempotency-key')?.trim() || `cart-checkout:${quote.quoteId}`;
    const order=await placeOrderFromQuote(user.id,quote.quoteId,key,paymentMethod);
    let payment:any=null;
    if(paymentMethod==='card') {
      const paymentKey=`checkout-payment:${key}`;
      payment=await withPgTransaction(client=>createPaymentIntent({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)}, {orderId:order.id,customerId:user.id,provider:String(readiness.provider),amount:order.total,currency:order.currency,idempotencyKey:paymentKey}));
    }
    const cartResult=await clearCartIfMatches(user.id,summary.cart.items);
    return NextResponse.json({ok:true,surfaceStatus:'LIVE',order,payment,quote:{quoteId:quote.quoteId,expiresAt:quote.expiresAt,total:quote.total,currency:quote.currency},cartCleared:cartResult.cleared,cartClearReason:cartResult.reason},{status:order.idempotentReplay?200:201,headers:{'Cache-Control':'no-store'}});
  } catch(e){
    const m=e instanceof Error?e.message:'CART_CHECKOUT_FAILED';
    const status=['CART_EMPTY','CART_REQUIRES_REFRESH','QUOTE_EXPIRED_OR_NOT_FOUND','QUOTE_PRICE_CHANGED','FULFILLMENT_PLAN_MISMATCH','NO_MARKETPLACE_OFFER','OFFER_NOT_AVAILABLE','INSUFFICIENT_OFFER_STOCK','FULFILLMENT_INVENTORY_UNAVAILABLE'].includes(m)?409:400;
    return NextResponse.json({ok:false,error:m},{status,headers:{'Cache-Control':'no-store'}});
  }
}
