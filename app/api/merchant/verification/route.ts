import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, AuthRequiredError } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId, submitMerchantVerification, getLatestVerificationRequest } from '../../../../modules/merchants/core/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ ok: false, error: 'MERCHANT_PROFILE_REQUIRED' }, { status: 404 });
  const latest = await getLatestVerificationRequest(merchant.id);
  return NextResponse.json(
    { ok: true, merchantStatus: merchant.verificationStatus, latestRequest: latest ?? null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) throw new AuthRequiredError();
    const body = await request.json();
    const request_ = await submitMerchantVerification(user.id, {
      legalName: body?.legalName,
      nationalIdNumber: body?.nationalIdNumber,
      commercialRegistryNumber: body?.commercialRegistryNumber,
      phoneNumber: body?.phoneNumber,
      idDocumentUrl: body?.idDocumentUrl,
      registryDocumentUrl: body?.registryDocumentUrl,
    });
    return NextResponse.json({ ok: true, request: request_ }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification submission failed';
    const status = message === 'Authentication required' ? 401
      : ['MERCHANT_PROFILE_REQUIRED', 'ALREADY_VERIFIED', 'VERIFICATION_ALREADY_PENDING'].includes(message) ? 409
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
