import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const session = request.cookies.get('trust_session')?.value;
  if (!session) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED', requestId }, { status: 401 });
  return NextResponse.json({ ok: true, merchant: null, message: 'Merchant persistence adapter is ready for database binding.', requestId }, { headers: { 'Cache-Control': 'no-store' } });
}
