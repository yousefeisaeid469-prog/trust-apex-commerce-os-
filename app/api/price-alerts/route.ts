import { NextResponse, type NextRequest } from 'next/server';
import { query, withPgTransaction } from '../../../modules/platform/db/postgres';
import { requireUser } from '../../../modules/platform/auth/current-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const result = await query(
      `select w.id,w.product_id,w.target_price,w.baseline_price,w.currency,w.status,w.created_at,w.updated_at,
              p.name,p.price,p.image
       from trust_price_watch w join trust_products p on p.id=w.product_id
       where w.customer_id=$1 order by w.created_at desc`,
      [user.id],
    );
    return NextResponse.json({ ok: true, surfaceStatus: 'LIVE', source: 'trust_price_watch + trust_products', alerts: result.rows.map(r => ({
      id: String(r.id), productId: String(r.product_id), productName: String(r.name), image: String(r.image ?? ''),
      targetPrice: r.target_price === null ? null : Number(r.target_price), currentPrice: Number(r.price),
      baselinePrice: r.baseline_price === null ? null : Number(r.baseline_price), currency: String(r.currency),
      status: String(r.status), createdAt: new Date(r.created_at).toISOString(), updatedAt: new Date(r.updated_at).toISOString(),
    })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PRICE_ALERTS_UNAVAILABLE';
    return NextResponse.json({ ok: false, surfaceStatus: 'ERROR', error: code }, { status: code === 'Authentication required' ? 401 : code === 'DATABASE_NOT_CONFIGURED' ? 503 : 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : '';
    const targetPrice = body?.targetPrice === null || body?.targetPrice === undefined ? null : Number(body.targetPrice);
    if (!productId || (targetPrice !== null && (!Number.isFinite(targetPrice) || targetPrice <= 0))) {
      return NextResponse.json({ ok: false, error: 'INVALID_PRICE_ALERT' }, { status: 400 });
    }
    const result = await withPgTransaction(async client => {
      const product = await client.query<{ price: number | string }>('select price from trust_products where id=$1 and active=true for share', [productId]);
      if (!product.rows[0]) throw new Error('PRODUCT_NOT_FOUND');
      const currentPrice = Number(product.rows[0].price);
      const inserted = await client.query<{ id: string }>(
        `insert into trust_price_watch(customer_id,product_id,target_price,baseline_price,status)
         values($1,$2,$3,$4,'ACTIVE') returning id`,
        [user.id, productId, targetPrice, currentPrice],
      );
      return { id: inserted.rows[0].id, productId, targetPrice, baselinePrice: currentPrice, status: 'ACTIVE' as const };
    });
    return NextResponse.json({ ok: true, surfaceStatus: 'LIVE', alert: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PRICE_ALERT_CREATE_FAILED';
    return NextResponse.json({ ok: false, surfaceStatus: 'ERROR', error: code }, { status: code === 'Authentication required' ? 401 : code === 'DATABASE_NOT_CONFIGURED' ? 503 : 400 });
  }
}
