import { NextResponse } from 'next/server';
import { platformOverview } from '../../../../lib/platform/overview';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, version: '134.0.0', ...platformOverview, generatedAt: platformOverview.generatedAt() }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
