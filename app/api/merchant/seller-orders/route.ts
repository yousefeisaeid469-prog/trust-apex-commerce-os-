import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listSellerOrders } from '../../../../modules/marketplace/seller-orders';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const m=await getMerchantByUserId(u.id); if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
 return NextResponse.json({ok:true,orders:await listSellerOrders(m.id,{status:req.nextUrl.searchParams.get('status')??undefined,limit:Number(req.nextUrl.searchParams.get('limit')??50)})},{headers:{'Cache-Control':'no-store'}});
}
