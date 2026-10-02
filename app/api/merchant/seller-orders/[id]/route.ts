import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../modules/merchants/core/store';
import { getSellerOrderForMerchant } from '../../../../../modules/marketplace/seller-orders';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(_req:NextRequest,{params}:{params:{id:string}}){
 const u=await getCurrentUser(_req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const m=await getMerchantByUserId(u.id); if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
 try{return NextResponse.json({ok:true,order:await getSellerOrderForMerchant(m.id,params.id)},{headers:{'Cache-Control':'no-store'}})}catch(e:any){return NextResponse.json({ok:false,error:e?.message??'SELLER_ORDER_NOT_FOUND'},{status:e?.message==='SELLER_ORDER_NOT_FOUND'?404:400});}
}
