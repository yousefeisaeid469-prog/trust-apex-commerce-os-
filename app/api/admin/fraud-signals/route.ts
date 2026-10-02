import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../../../modules/platform/admin/access';
import { listOpenFraudSignals, reviewFraudSignal } from '../../../../modules/commerce/fraud/rules';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  return verifyAdminSession(token);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ ok: false, error: 'ADMIN_AUTH_REQUIRED' }, { status: 401 });
  const signals = await listOpenFraudSignals();
  return NextResponse.json({ ok: true, signals }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ ok: false, error: 'ADMIN_AUTH_REQUIRED' }, { status: 401 });
    const body = await request.json();
    if (typeof body?.signalId !== 'string' || !['REVIEWED_OK', 'REVIEWED_BLOCKED'].includes(body?.decision)) {
      return NextResponse.json({ ok: false, error: 'INVALID_REVIEW_PAYLOAD' }, { status: 400 });
    }
    const result = await reviewFraudSignal(body.signalId, body.decision, admin.email);
    return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fraud signal review failed';
    return NextResponse.json({ ok: false, error: message }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
