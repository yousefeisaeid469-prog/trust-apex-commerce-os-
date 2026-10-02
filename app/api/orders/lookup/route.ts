import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../modules/platform/db/postgres';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { rateLimitDistributed } from '../../../../modules/platform/security/rate-limit/distributed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^01[0125]\d{8}$/;

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = forwarded || request.headers.get('x-real-ip') || 'unknown';
  try {
    const limit = await rateLimitDistributed(`order-lookup:${clientIp}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, error: 'ORDER_LOOKUP_RATE_LIMITED' }, { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))), 'X-RateLimit-Limit': String(limit.limit), 'X-RateLimit-Remaining': String(limit.remaining), 'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)) } });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'SHARED_RATE_LIMIT_STORE_NOT_CONFIGURED') {
      return NextResponse.json({ ok: false, error: 'RATE_LIMIT_BACKEND_NOT_CONFIGURED' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ ok: false, error: 'ORDER_LOOKUP_PROTECTION_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const orderId = request.nextUrl.searchParams.get('orderId')?.trim() ?? '';
  const phone = request.nextUrl.searchParams.get('phone')?.trim() ?? '';
  if (!UUID_RE.test(orderId)) return NextResponse.json({ ok: false, error: 'INVALID_ORDER_ID' }, { status: 400 });

  const orderResult = await query(
    `select id,customer_id,status,payment_method,subtotal,shipping,total,currency,guest_name,guest_phone,guest_address,created_at
     from trust_orders where id=$1 limit 1`,
    [orderId]
  );
  const order = orderResult.rows[0];
  if (!order) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });

  const user = await getCurrentUser(request);
  const isOwner = user && order.customer_id === user.id;
  const isPrivileged = user && ['admin', 'support', 'operations'].includes(user.role);
  const guestPhone = String(order.guest_phone ?? '');
  const isGuestMatch = !order.customer_id && PHONE_RE.test(phone) && phone === guestPhone;

  if (!isOwner && !isPrivileged && !isGuestMatch) {
    return NextResponse.json({ ok: false, error: 'ORDER_ACCESS_DENIED' }, { status: 403 });
  }

  const items = await query(
    `select oi.product_id,oi.quantity,oi.unit_price,p.name,p.image from trust_order_items oi join trust_products p on p.id=oi.product_id where oi.order_id=$1`,
    [orderId]
  );

  return NextResponse.json(
    {
      ok: true,
      order: {
        id: order.id, status: order.status, paymentMethod: order.payment_method,
        subtotal: Number(order.subtotal), shipping: Number(order.shipping), total: Number(order.total),
        currency: order.currency, createdAt: order.created_at,
      },
      items: items.rows.map((r: any) => ({ productId: r.product_id, name: r.name, image: r.image, quantity: Number(r.quantity), unitPrice: Number(r.unit_price) })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
