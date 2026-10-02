import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { query } from '../../../../../modules/platform/db/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  const result = await query<any>(`select o.id,o.status,o.currency,o.destination_country,o.locale,o.settlement_currency,o.shipping_mode,o.global_quote_id,g.status orchestration_status,g.fulfillment_order_count,g.settlement_id,g.last_error_code,g.updated_at from trust_orders o left join trust_global_order_orchestrations g on g.order_id=o.id where o.id=$1 and o.customer_id=$2`, [params.id, user.id]);
  if (!result.rows[0]) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ ok: true, version: 'V301.0.0', order: result.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
}
