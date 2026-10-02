import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listOffers, resolveBuyBox, createOffer, type FulfillmentMode } from '../../../../modules/marketplace/offers';
import { query } from '../../../../modules/platform/db/postgres';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const productId=req.nextUrl.searchParams.get('productId'); const catalogItemId=req.nextUrl.searchParams.get('catalogItemId');
  if(productId){const r=await query(`select catalog_item_id from trust_marketplace_offers where product_id=$1 limit 1`,[productId]);if(!r.rows[0])return NextResponse.json({ok:false,error:'PRODUCT_NOT_FOUND'},{status:404});const data=await resolveBuyBox(String(r.rows[0].catalog_item_id));return NextResponse.json({ok:true,...data},{headers:{'Cache-Control':'no-store'}})}
  if(catalogItemId)return NextResponse.json({ok:true,offers:await listOffers(catalogItemId)},{headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({ok:false,error:'PRODUCT_ID_REQUIRED'},{status:400});
}
export async function POST(req:NextRequest){
  const user=await getCurrentUser(req);if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(user.id);if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
  try{const b=await req.json();const product=String(b?.productId??'');const owner=(await query(`select 1 from trust_products where id=$1 and merchant_id=$2 and active=true`,[product,merchant.id])).rows[0];if(!owner)throw new Error('PRODUCT_MERCHANT_MISMATCH');const offer=await createOffer({catalogItemId:typeof b?.catalogItemId==='string'&&b.catalogItemId.trim()?b.catalogItemId:undefined,productId:product,merchantId:merchant.id,price:Number(b?.price),shippingFee:Number(b?.shippingFee??0),stock:Number(b?.stock??0),handlingDays:Number(b?.handlingDays??1),deliveryMinDays:Number(b?.deliveryMinDays??2),deliveryMaxDays:Number(b?.deliveryMaxDays??5),fulfillmentMode:b?.fulfillmentMode as FulfillmentMode|undefined});return NextResponse.json({ok:true,offer},{status:201});}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'OFFER_CREATE_FAILED'},{status:400});}
}
