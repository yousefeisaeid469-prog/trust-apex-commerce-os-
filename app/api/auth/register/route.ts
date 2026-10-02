import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSession } from '../../../../modules/platform/auth/store';
import { setSessionCookie } from '../../../../modules/platform/auth/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await registerUser({ email: String(body?.email ?? ''), password: String(body?.password ?? ''), role: 'customer' });
    const session = await createSession(user.id);
    const response = NextResponse.json({ ok: true, user }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    setSessionCookie(response, session.id);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message === 'Account already exists' ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
