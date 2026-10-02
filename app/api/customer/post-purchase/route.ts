import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getPostPurchaseOverview, getReviewEligibility, getLoyaltyEligibility } from '../../../../modules/customer-experience/post-purchase-os';
export const dynamic='force-dynamic'; export const runtime='nodejs';
function json(body:unknown,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});}
export async function GET(request:NextRequest){
 const user=await getCurrentUser(request); if(!user)return json({ok:false,error:'AUTH_REQUIRED'},401);
 try{
  const productId=request.nextUrl.searchParams.get('productId'); const orderId=request.nextUrl.searchParams.get('orderId');
  if(productId) return json({ok:true,surfaceStatus:'LIVE',reviewEligibility:await getReviewEligibility(user.id,productId)});
  if(orderId) return json({ok:true,surfaceStatus:'LIVE',loyaltyEligibility:await getLoyaltyEligibility(user.id,orderId)});
  return json({ok:true,overview:await getPostPurchaseOverview(user.id)});
 }catch(error){return json({ok:false,error:error instanceof Error?error.message:'POST_PURCHASE_ERROR'},400);}
}
