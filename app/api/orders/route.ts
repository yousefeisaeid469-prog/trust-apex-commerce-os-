import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../modules/platform/db/postgres';
import { getCurrentUser, AuthRequiredError } from '../../../modules/platform/auth/current-user';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw new AuthRequiredError();

    const privileged = ['admin', 'support', 'operations'].includes(user.role);
    const result = privileged
      ? await query(`select id,customer_id,status,subtotal,discount,shipping,total,currency,payment_method,created_at,updated_at from trust_orders order by created_at desc limit 100`)
      : await query(`select id,customer_id,status,subtotal,discount,shipping,total,currency,payment_method,created_at,updated_at from trust_orders where customer_id=$1 order by created_at desc limit 100`, [user.id]);

    return NextResponse.json({
      ok: true,
      surfaceStatus: 'LIVE',
      source: 'postgresql',
      items: result.rows.map((row: any) => ({
        id: String(row.id),
        customerId: row.customer_id ? String(row.customer_id) : null,
        status: row.status,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        shipping: Number(row.shipping),
        total: Number(row.total),
        currency: row.currency,
        paymentMethod: row.payment_method,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total: result.rows.length,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AuthRequiredError) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    const code = error instanceof Error ? error.message : 'ORDERS_UNAVAILABLE';
    return NextResponse.json({ ok: false, error: code }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
