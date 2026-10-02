import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../modules/merchants/core/store';
import { listMerchantOffers, updateMerchantOffer, getMerchantOfferHistory, type OfferStatus, type FulfillmentMode } from '../../../../../modules/marketplace/offers';

export const dynamic='force-dynamic';
export const runtime='nodejs';

async function context(req:NextRequest){
  const user=await getCurrentUser(req); if(!user) return {response:NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401})};
  const merchant=await getMerchantByUserId(user.id); if(!merchant) return {response:NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403})};
  return {user,merchant};
}

export async function GET(req:NextRequest){
  const c=await context(req); if('response' in c)return c.response;
  const offerId=req.nextUrl.searchParams.get('offerId');
  try{
    if(offerId) return NextResponse.json({ok:true,history:await getMerchantOfferHistory(offerId,c.merchant.id,Number(req.nextUrl.searchParams.get('limit')??50))},{headers:{'Cache-Control':'no-store'}});
    const status=req.nextUrl.searchParams.get('status');
    const allowed=['ACTIVE','PAUSED','SUSPENDED'];
    if(status && !allowed.includes(status)) return NextResponse.json({ok:false,error:'INVALID_OFFER_STATUS'},{status:400});
    return NextResponse.json({ok:true,...await listMerchantOffers(c.merchant.id,{status:status as OfferStatus|undefined,limit:Number(req.nextUrl.searchParams.get('limit')??50),cursor:req.nextUrl.searchParams.get('cursor')??undefined})},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'OFFER_LIST_FAILED'},{status:400});}
}

export async function PATCH(req:NextRequest){
  const c=await context(req); if('response' in c)return c.response;
  try{
    const b=await req.json();
    const offerId=String(b?.offerId??'').trim(); if(!offerId)return NextResponse.json({ok:false,error:'OFFER_ID_REQUIRED'},{status:400});
    const changes={
      price:b?.price===undefined?undefined:Number(b.price), shippingFee:b?.shippingFee===undefined?undefined:Number(b.shippingFee),
      stock:b?.stock===undefined?undefined:Number(b.stock), handlingDays:b?.handlingDays===undefined?undefined:Number(b.handlingDays),
      deliveryMinDays:b?.deliveryMinDays===undefined?undefined:Number(b.deliveryMinDays), deliveryMaxDays:b?.deliveryMaxDays===undefined?undefined:Number(b.deliveryMaxDays),
      fulfillmentMode:b?.fulfillmentMode as FulfillmentMode|undefined, status:b?.status as OfferStatus|undefined,
      expectedRevision:b?.expectedRevision===undefined?undefined:Number(b.expectedRevision), actorUserId:c.user.id
    };
    const offer=await updateMerchantOffer({offerId,merchantId:c.merchant.id,actorUserId:c.user.id,changes});
    return NextResponse.json({ok:true,offer,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
  }catch(e){const code=e instanceof Error?e.message:'OFFER_UPDATE_FAILED';const status=code==='OFFER_REVISION_CONFLICT'?409:400;return NextResponse.json({ok:false,error:code},{status});}
}
