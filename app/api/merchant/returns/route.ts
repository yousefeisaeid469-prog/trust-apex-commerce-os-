import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listSellerReturns } from '../../../../modules/commerce/returns/service';
import { query } from '../../../../modules/platform/db/postgres';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const m=await getMerchantByUserId(u.id); if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
 return NextResponse.json({ok:true,returns:await listSellerReturns({query} as any,m.id,{status:req.nextUrl.searchParams.get('status') as any,limit:Number(req.nextUrl.searchParams.get('limit')??50)})},{headers:{'Cache-Control':'no-store'}});
}
