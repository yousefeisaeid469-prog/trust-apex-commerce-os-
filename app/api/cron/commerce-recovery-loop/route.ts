import { NextResponse } from 'next/server';
import { runVerifiedCommerceRecovery } from '../../../../modules/platform/durable-events/recovery-loop.ts';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    const result = await runVerifiedCommerceRecovery('cron');
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'RECOVERY_FAILED' }, { status: 500 });
  }
}
