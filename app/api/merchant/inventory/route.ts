import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { updateMerchantInventory } from '../../../../modules/commerce/merchant-ops/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401, headers:{'Cache-Control':'no-store'} });
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ ok:false, error:'MERCHANT_REQUIRED' }, { status:403, headers:{'Cache-Control':'no-store'} });
  try {
    const body = await req.json();
    if (typeof body?.productId !== 'string') throw new Error('PRODUCT_ID_REQUIRED');
    const product = await updateMerchantInventory(merchant.id, body.productId, body.stock);
    return NextResponse.json({ ok:true, product }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INVENTORY_UPDATE_FAILED';
    return NextResponse.json({ ok:false, error:code }, { status: code === 'PRODUCT_NOT_FOUND' ? 404 : 400, headers:{'Cache-Control':'no-store'} });
  }
}
