import { NextRequest, NextResponse } from 'next/server';
import { listPending, pendingCount } from '@/lib/data-core/events/outbox';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ pending: await pendingCount(), mode: 'durable-postgresql-outbox' });
}

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_EVENT_SECRET;
  if (secret && request.headers.get('x-internal-event-secret') !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100);
  return NextResponse.json({
    error: 'LEGACY_OUTBOX_DRAIN_DISABLED',
    message: 'Outbox delivery is owned by the durable commerce event publisher. No event is acknowledged as delivered by this endpoint.',
    pending: await listPending(Number.isFinite(limit) ? limit : 50),
  }, { status: 501 });
}
