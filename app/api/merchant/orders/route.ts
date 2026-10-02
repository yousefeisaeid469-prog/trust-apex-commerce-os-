import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listMerchantOrders } from '../../../../modules/commerce/merchant-ops/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401, headers:{'Cache-Control':'no-store'} });
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ ok:false, error:'MERCHANT_REQUIRED' }, { status:403, headers:{'Cache-Control':'no-store'} });
  return NextResponse.json({ ok:true, orders:await listMerchantOrders(merchant.id) }, { headers:{'Cache-Control':'no-store'} });
}
