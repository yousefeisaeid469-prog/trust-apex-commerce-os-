import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {listSellerDisputesForMerchant} from '../../../../modules/marketplace/seller-disputes';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});if(!['merchant','admin','operations'].includes(u.role))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});return NextResponse.json({ok:true,items:await listSellerDisputesForMerchant(String(u.merchantId??u.id),{status:req.nextUrl.searchParams.get('status')??undefined})});}
