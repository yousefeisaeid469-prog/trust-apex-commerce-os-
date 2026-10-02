import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { listMerchantProducts, createMerchantProduct } from '../../../../modules/commerce/repository/catalog';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : 'REQUEST_FAILED';
  const status = code === 'AUTH_REQUIRED' ? 401 : code === 'MERCHANT_REQUIRED' ? 403 : 400;
  return NextResponse.json({ ok:false, error:code }, { status, headers:{'Cache-Control':'no-store'} });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return errorResponse(new Error('AUTH_REQUIRED'));
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return errorResponse(new Error('MERCHANT_REQUIRED'));
  return NextResponse.json({ ok:true, products:await listMerchantProducts(merchant.id) }, { headers:{'Cache-Control':'no-store'} });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return errorResponse(new Error('AUTH_REQUIRED'));
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return errorResponse(new Error('MERCHANT_REQUIRED'));
  try {
    const body = await request.json();
    const product = await createMerchantProduct(merchant.id, merchant.storeName, body);
    return NextResponse.json({ok:true, product}, {status:201, headers:{'Cache-Control':'no-store'}});
  } catch (error) { return errorResponse(error); }
}
