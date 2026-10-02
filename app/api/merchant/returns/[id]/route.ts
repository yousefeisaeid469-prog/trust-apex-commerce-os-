import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../modules/merchants/core/store';
import { getSellerReturnForMerchant,returnItemsDetailed } from '../../../../../modules/commerce/returns/service';
import { query } from '../../../../../modules/platform/db/postgres';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:{id:string}}){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const m=await getMerchantByUserId(u.id); if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
 const result=await getSellerReturnForMerchant({query} as any,{merchantId:m.id,returnId:params.id});
 if(!result)return NextResponse.json({ok:false,error:'RETURN_NOT_FOUND_OR_NOT_OWNED'},{status:404});
 return NextResponse.json({ok:true,return:result,items:await returnItemsDetailed({query} as any,params.id)},{headers:{'Cache-Control':'no-store'}});
}
