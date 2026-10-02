import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../../modules/platform/auth/current-user';
import { query, withPgTransaction } from '../../../../../../modules/platform/db/postgres';
import { completeGlobalDeliveryTx, getGlobalFulfillmentExecutionTx } from '../../../../../../modules/platform/global-order-v302';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  const order = (await query<any>(`select id from trust_orders where id=$1 and customer_id=$2`, [params.id, user.id])).rows[0];
  if (!order) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });
  const execution = await withPgTransaction(tx => getGlobalFulfillmentExecutionTx(tx, params.id));
  if (!execution) return NextResponse.json({ ok: false, error: 'GLOBAL_ORCHESTRATION_NOT_FOUND' }, { status: 404 });
  const fulfillments = (await query<any>(`select f.id,f.order_shipment_id,f.merchant_id,f.status,f.shipment_id,s.status shipment_status,s.tracking_number,s.carrier,s.service from trust_marketplace_fulfillment_orders f left join trust_shipments s on s.id=f.shipment_id where f.global_orchestration_id=$1 order by f.created_at,f.id`, [execution.id])).rows;
  return NextResponse.json({ ok: true, version: 'V302.0.0', execution, fulfillments }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  const order = (await query<any>(`select id from trust_orders where id=$1 and customer_id=$2`, [params.id, user.id])).rows[0];
  if (!order) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });
  const key = req.headers.get('idempotency-key')?.trim();
  if (!key) return NextResponse.json({ ok: false, error: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
  try {
    const body = await req.json().catch(() => ({}));
    const shipmentId = String(body.shipmentId ?? '');
    if (!shipmentId) return NextResponse.json({ ok: false, error: 'SHIPMENT_ID_REQUIRED' }, { status: 400 });
    const result = await withPgTransaction(tx => completeGlobalDeliveryTx(tx, { orderId: params.id, shipmentId, triggerKey: key }));
    return NextResponse.json({ ok: true, version: 'V302.0.0', result }, { status: result.replay ? 200 : 201 });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'GLOBAL_FULFILLMENT_EXECUTION_FAILED';
    return NextResponse.json({ ok: false, error }, { status: error === 'DATABASE_NOT_CONFIGURED' ? 503 : 400 });
  }
}
