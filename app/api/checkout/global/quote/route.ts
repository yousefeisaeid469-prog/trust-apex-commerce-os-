import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { createGlobalCheckoutQuote } from '../../../../../modules/platform/global-commerce-v298';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const serialize=(v:any):any=>typeof v==='bigint'?v.toString():Array.isArray(v)?v.map(serialize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,serialize(x)])):v;
export async function POST(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{
    const body=await req.json();
    const quote=await createGlobalCheckoutQuote({...body,customerId:user.id});
    return NextResponse.json({ok:true,surfaceStatus:'LIVE',version:'V298.0.0',quote:serialize(quote)},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(e){
    const m=e instanceof Error?e.message:'GLOBAL_QUOTE_ERROR';
    const status=['EMPTY_CART','INVALID_QUOTE_TTL','INVALID_QUANTITY','INSUFFICIENT_OFFER_STOCK','NO_MARKETPLACE_OFFER','OFFER_NOT_AVAILABLE','COUNTRY_NOT_SUPPORTED','LOCALE_NOT_SUPPORTED','SETTLEMENT_CURRENCY_NOT_SUPPORTED','FX_QUOTE_REQUIRED','FX_QUOTE_EXPIRED','SHIPPING_MODE_NOT_AVAILABLE'].includes(m)?409:400;
    return NextResponse.json({ok:false,version:'V298.0.0',error:m},{status,headers:{'Cache-Control':'no-store'}});
  }
}
