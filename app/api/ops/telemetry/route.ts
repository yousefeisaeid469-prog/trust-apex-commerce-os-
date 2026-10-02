import { NextRequest, NextResponse } from 'next/server';
import { telemetrySnapshot } from '../../../../modules/platform/observability/telemetry';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '../../../../modules/platform/admin/access';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if (!session) return NextResponse.json({ ok: false, error: 'ADMIN_REQUIRED' }, { status: 401 });
  return NextResponse.json(telemetrySnapshot(), { headers: { 'Cache-Control': 'no-store' } });
}
