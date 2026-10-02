import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { updateMerchantProduct } from '../../../../../modules/commerce/repository/catalog';
import { getMerchantByUserId } from '../../../../../modules/merchants/core/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
  try {
    const body = await request.json();
    const product = await updateMerchantProduct(merchant.id, params.id, body);
    return NextResponse.json({ok:true, product}, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UPDATE_FAILED';
    return NextResponse.json({ok:false,error:code},{status:code==='PRODUCT_NOT_FOUND'?404:400,headers:{'Cache-Control':'no-store'}});
  }
}
