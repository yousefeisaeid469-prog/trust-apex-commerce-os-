import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../modules/platform/db/postgres';
import { runCommerceEventPublisher } from '../../../../modules/platform/commerce-events/publisher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok:false, error:'UNAUTHORIZED' }, { status:401 });
  if (!databaseConfigured()) return NextResponse.json({ ok:false, error:'DATABASE_NOT_CONFIGURED' }, { status:503 });
  try {
    const result = await runCommerceEventPublisher({ trigger:'vercel-cron', batchSize: Number(process.env.TRUST_COMMERCE_EVENT_CRON_BATCH_SIZE ?? 25) });
    return NextResponse.json({ ok: result.dead === 0 && result.failed === 0, publisher: result }, { status: result.dead === 0 && result.failed === 0 ? 200 : 503, headers:{'cache-control':'no-store'} });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error instanceof Error ? error.message : 'PUBLISHER_CRON_FAILED' }, { status:503 });
  }
}
