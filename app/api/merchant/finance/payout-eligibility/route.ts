import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../../modules/platform/security/route-auth';
import {getMerchantByUserId} from '../../../../../modules/merchants/core/store';
import {withPgTransaction} from '../../../../../modules/platform/db/postgres';
import {calculatePayoutEligibilityTx} from '../../../../../modules/marketplace/financial-loop';

export const dynamic='force-dynamic';

export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  try{
    const result=await withPgTransaction(tx=>calculatePayoutEligibilityTx(tx,{merchantId:merchant.id,currency:req.nextUrl.searchParams.get('currency')??undefined,idempotencyKey:`eligibility:read:${merchant.id}:${Date.now()}`}));
    return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
  }catch(e){const m=e instanceof Error?e.message:'PAYOUT_ELIGIBILITY_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:400});}
}
