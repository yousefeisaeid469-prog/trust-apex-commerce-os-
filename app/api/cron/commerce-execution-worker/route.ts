import { NextRequest, NextResponse } from 'next/server';
import { query, withPgTransaction, databaseConfigured } from '../../../../modules/platform/db/postgres';
import { runCommerceExecutionWorker, recoverExpiredCommerceExecutionLeases, startCommerceWorkerRun, finishCommerceWorkerRun } from '../../../../modules/commerce/core/execution-worker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const configured = process.env.CRON_SECRET?.trim();
  if (!configured) return false;
  const authorization = req.headers.get('authorization')?.trim();
  return authorization === `Bearer ${configured}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'CRON_UNAUTHORIZED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!databaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'DATABASE_NOT_CONFIGURED' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const batch = Math.min(Math.max(Number(process.env.TRUST_COMMERCE_CRON_BATCH ?? 10), 1), 25);
  const db = { query, transaction: withPgTransaction };

  const workerId = `vercel-cron:${process.env.VERCEL_REGION ?? 'unknown'}:${crypto.randomUUID()}`;
  let runId: string | null = null;
  try {
    runId = await startCommerceWorkerRun(db, { workerId, trigger: 'vercel-cron', region: process.env.VERCEL_REGION ?? null });
    const recovered = await recoverExpiredCommerceExecutionLeases(db);
    const result = await runCommerceExecutionWorker(db, { limit: batch, workerId });
    await finishCommerceWorkerRun(db, runId, { ...result, recovered: recovered.recovered });

    return NextResponse.json(
      { ok: true, trigger: 'vercel-cron', runId, recovered: recovered.recovered, ...result },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'COMMERCE_EXECUTION_WORKER_FAILED';
    if (runId) { try { await finishCommerceWorkerRun(db, runId, { claimed:0,succeeded:0,waiting:0,failed:1,dead:0,recovered:0 }, message); } catch {} }
    return NextResponse.json(
      { ok: false, error: message },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
