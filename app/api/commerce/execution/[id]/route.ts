import { NextRequest, NextResponse } from 'next/server';
import { withPgTransaction } from '../../../../../modules/platform/db/postgres';
import { requirePermission, AuthRequiredError, ForbiddenError } from '../../../../../modules/platform/auth/current-user';
import { getCommerceExecutionKernelTx, resumeCommerceExecutionTx } from '../../../../../modules/commerce/core/execution-kernel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requirePermission(req, 'orders:operate');
    const result = await withPgTransaction(tx => getCommerceExecutionKernelTx(tx, params.id));
    if (!result) return NextResponse.json({ ok: false, error: 'COMMERCE_EXECUTION_RUN_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AuthRequiredError) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : 'EXECUTION_STATE_UNAVAILABLE';
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requirePermission(req, 'orders:operate');
    const body = await req.json().catch(() => ({}));
    const idempotencyKey = req.headers.get('idempotency-key')?.trim() || String(body?.idempotencyKey ?? '').trim();
    if (!idempotencyKey) return NextResponse.json({ ok: false, error: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
    const result = await withPgTransaction(tx => resumeCommerceExecutionTx(tx, { orderId: params.id, idempotencyKey }));
    return NextResponse.json({ ok: true, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AuthRequiredError) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : 'EXECUTION_RECOVERY_FAILED';
    const status = message === 'COMMERCE_EXECUTION_RUN_NOT_FOUND' ? 404 : message === 'DATABASE_NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
