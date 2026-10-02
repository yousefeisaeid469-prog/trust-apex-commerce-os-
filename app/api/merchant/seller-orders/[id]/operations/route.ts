import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../../modules/merchants/core/store';
import { getSellerOrderOperationsForMerchant } from '../../../../../../modules/marketplace/seller-operations';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:{id:string}}){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const m=await getMerchantByUserId(u.id); if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
 try{return NextResponse.json({ok:true,operations:await getSellerOrderOperationsForMerchant(m.id,params.id),surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}})}catch(e:any){const msg=e?.message??'SELLER_ORDER_OPERATIONS_FAILED';return NextResponse.json({ok:false,error:msg},{status:msg.includes('NOT_FOUND')?404:409});}
}
