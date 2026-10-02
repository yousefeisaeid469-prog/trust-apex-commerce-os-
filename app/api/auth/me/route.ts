import { NextRequest, NextResponse } from 'next/server';
import { getUserBySession } from '../../../../modules/platform/auth/store';
import { SESSION_COOKIE } from '../../../../modules/platform/auth/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const user = sessionId ? await getUserBySession(sessionId) : undefined;
  return NextResponse.json({ ok: true, authenticated: Boolean(user), user: user ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
