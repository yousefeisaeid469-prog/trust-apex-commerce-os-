import { NextResponse } from 'next/server';
import { runtimeVersion } from '@/lib/runtime/version';

export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({ service: 'trust-apex-os', version: runtimeVersion, status: 'ok' });
}
