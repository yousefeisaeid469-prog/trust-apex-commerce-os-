import { NextRequest, NextResponse } from 'next/server';
import { replay } from '@/lib/data-core/security/idempotency';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const fingerprint = request.nextUrl.searchParams.get('fingerprint');
  if (!key || !fingerprint) return NextResponse.json({ error: 'key and fingerprint are required' }, { status: 400 });
  try { return NextResponse.json(replay(key, fingerprint)); }
  catch { return NextResponse.json({ error: 'Idempotency conflict' }, { status: 409 }); }
}
