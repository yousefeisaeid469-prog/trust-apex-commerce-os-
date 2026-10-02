import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../modules/merchants/core/store';
import { bulkUpdateMerchantInventory } from '../../../../../modules/commerce/merchant-ops/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401, headers:{'Cache-Control':'no-store'} });
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ ok:false, error:'MERCHANT_REQUIRED' }, { status:403, headers:{'Cache-Control':'no-store'} });
  try {
    const body = await request.json();
    const products = await bulkUpdateMerchantInventory(merchant.id, body?.updates);
    return NextResponse.json({ ok:true, updated:products.length, products }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'REQUEST_FAILED';
    const status = ['INVALID_BATCH','INVALID_PRODUCT_ID','INVALID_STOCK','PRODUCT_NOT_FOUND'].includes(code) ? 400 : 500;
    return NextResponse.json({ ok:false, error:code }, { status, headers:{'Cache-Control':'no-store'} });
  }
}
