import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '../../../../modules/platform/auth/store';
import { clearSessionCookie, SESSION_COOKIE } from '../../../../modules/platform/auth/http';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) revokeSession(sessionId);
  const response = NextResponse.json({ ok: true, signedOut: true }, { headers: { 'Cache-Control': 'no-store' } });
  clearSessionCookie(response);
  return response;
}
