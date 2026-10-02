import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../modules/platform/auth/current-user';
import {getMerchantByUserId} from '../../../modules/merchants/core/store';
import {listMerchantProducts} from '../../../modules/commerce/repository/catalog';
import {listMerchantOrders} from '../../../modules/commerce/merchant-ops/service';
import {buildSellerSuperBrief} from '../../../modules/platform/seller-super-os/core';

export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
  const merchant=await getMerchantByUserId(user.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403,headers:{'Cache-Control':'no-store'}});
  const [products,orders]=await Promise.all([listMerchantProducts(merchant.id),listMerchantOrders(merchant.id)]);
  const brief=buildSellerSuperBrief({products,orders,verificationStatus:merchant.verificationStatus});
  return NextResponse.json({ok:true,version:'V204',merchant:{id:merchant.id,storeName:merchant.storeName,verificationStatus:merchant.verificationStatus},brief},{headers:{'Cache-Control':'no-store'}});
}
