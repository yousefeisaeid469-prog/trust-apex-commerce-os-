import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, AuthRequiredError, ForbiddenError } from '../../../../modules/platform/auth/current-user';
import { createMerchantProfile, getMerchantByUserId } from '../../../../modules/merchants/core/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  return NextResponse.json({ ok: true, merchant: await getMerchantByUserId(user.id) ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) throw new AuthRequiredError();
    if (user.role !== 'customer' && user.role !== 'merchant') throw new ForbiddenError();
    const body = await request.json();
    if (typeof body?.storeName !== 'string') return NextResponse.json({ ok: false, error: 'storeName is required' }, { status: 400 });
    const merchant = await createMerchantProfile(user.id, body.storeName);
    return NextResponse.json({ ok: true, merchant }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Merchant onboarding failed';
    const status = message === 'Authentication required' ? 401 : message === 'You do not have permission to perform this action' ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
