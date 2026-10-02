import { NextResponse } from 'next/server';
import { query } from '../../../modules/platform/db/postgres';

export const dynamic = 'force-dynamic';

function parseIds(value: string | null) {
  return [...new Set((value ?? '').split(',').map(v => v.trim()).filter(Boolean))].slice(0, 8);
}

export async function GET(request: Request) {
  const ids = parseIds(new URL(request.url).searchParams.get('ids'));
  if (!ids.length) return NextResponse.json({ ok: false, surfaceStatus: 'ERROR', error: 'PRODUCT_IDS_REQUIRED' }, { status: 400 });
  try {
    const result = await query(
      `select p.id,p.name,p.category,p.price,p.old_price,p.stock,p.region,p.tags,p.image,p.rating,m.store_name
       from trust_products p join trust_merchant_profiles m on m.id=p.merchant_id
       where p.id=any($1::uuid[]) and p.active=true`,
      [ids],
    );
    return NextResponse.json({
      ok: true, surfaceStatus: 'LIVE', source: 'trust_products',
      requestedIds: ids, products: result.rows.map(r => ({
        id: String(r.id), name: String(r.name), category: String(r.category), price: Number(r.price),
        oldPrice: r.old_price === null ? null : Number(r.old_price), stock: Number(r.stock), region: String(r.region),
        tags: Array.isArray(r.tags) ? r.tags : [], image: String(r.image ?? ''), rating: Number(r.rating),
        merchantName: String(r.store_name ?? ''),
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'COMPARE_UNAVAILABLE';
    return NextResponse.json({ ok: false, surfaceStatus: 'ERROR', error: code }, { status: code === 'DATABASE_NOT_CONFIGURED' ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body?.productIds) ? body.productIds.map(String).join(',') : '';
  return GET(new Request(new URL(`/api/compare?ids=${encodeURIComponent(ids)}`, request.url)));
}
