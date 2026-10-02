import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { getSellerOperatingSurface } from '../../../../modules/platform/seller-os-operating-surface';
import { TRUST_VERSION_NUMBER } from '../../../../lib/runtime/version';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
  const merchant=await getMerchantByUserId(user.id);
  if(!merchant) return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403,headers:{'Cache-Control':'no-store'}});
  try{return NextResponse.json({ok:true,version:TRUST_VERSION_NUMBER,surface:'GLOBAL_SELLER_OPERATING_SYSTEM',operating:await getSellerOperatingSurface(merchant.id)},{headers:{'Cache-Control':'no-store'}})}
  catch(e){const code=e instanceof Error?e.message:'SELLER_OPERATING_SURFACE_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:500,headers:{'Cache-Control':'no-store'}})}
}
