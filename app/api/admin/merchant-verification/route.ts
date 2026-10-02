import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../../../modules/platform/admin/access';
import { listPendingVerificationRequests, reviewMerchantVerification } from '../../../../modules/merchants/core/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const session = await verifyAdminSession(token);
  if (!session) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ ok: false, error: 'ADMIN_AUTH_REQUIRED' }, { status: 401 });
  const pending = await listPendingVerificationRequests();
  return NextResponse.json({ ok: true, pending }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ ok: false, error: 'ADMIN_AUTH_REQUIRED' }, { status: 401 });
    const body = await request.json();
    if (typeof body?.requestId !== 'string' || !['approved', 'rejected'].includes(body?.decision)) {
      return NextResponse.json({ ok: false, error: 'INVALID_REVIEW_PAYLOAD' }, { status: 400 });
    }
    const updated = await reviewMerchantVerification(body.requestId, admin.email, body.decision, body.rejectionReason);
    return NextResponse.json({ ok: true, request: updated }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification review failed';
    return NextResponse.json({ ok: false, error: message }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
