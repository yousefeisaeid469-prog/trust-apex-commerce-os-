import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { withPgTransaction } from '../../../../../modules/platform/db/postgres';
import { refreshCommerceExecutionGraphTx } from '../../../../../modules/commerce/core/execution-graph';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const privileged = (role: string) => ['admin', 'support', 'operations'].includes(role);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  try {
    const graph = await withPgTransaction(async tx => {
      const order = (await tx.query<{ customer_id: string | null }>(`select customer_id from trust_orders where id=$1`, [params.id])).rows[0];
      if (!order) return null;
      if (!privileged(user.role) && order.customer_id !== user.id) throw new Error('FORBIDDEN');
      return refreshCommerceExecutionGraphTx(tx, params.id);
    });
    if (!graph) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ ok: true, graph }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'EXECUTION_GRAPH_FAILED';
    return NextResponse.json({ ok: false, error: code }, { status: code === 'FORBIDDEN' ? 403 : code === 'DATABASE_NOT_CONFIGURED' ? 503 : 400 });
  }
}
