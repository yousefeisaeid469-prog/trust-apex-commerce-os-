import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession } from '../../../../modules/platform/auth/store';
import { setSessionCookie } from '../../../../modules/platform/auth/http';
import { loginAllowed, recordLoginFailure, clearLoginFailures } from '../../../../modules/platform/security/auth-throttle';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (process.env.DATABASE_URL && !(await loginAllowed(email, ip))) {
      return NextResponse.json({ ok: false, error: 'AUTH_RATE_LIMITED' }, { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': '900' } });
    }
    const user = await authenticateUser(email, String(body?.password ?? ''));
    if (!user) {
      if (process.env.DATABASE_URL) await recordLoginFailure(email, ip);
      return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    if (process.env.DATABASE_URL) await clearLoginFailures(email, ip);
    const session = await createSession(user.id);
    const response = NextResponse.json({ ok: true, user }, { headers: { 'Cache-Control': 'no-store' } });
    setSessionCookie(response, session.id);
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
