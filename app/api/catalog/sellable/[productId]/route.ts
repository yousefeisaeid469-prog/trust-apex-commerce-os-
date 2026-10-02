import { NextResponse } from 'next/server';
import { getSellableCatalogTruth } from '../../../../../modules/commerce/catalog/sellable-truth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { productId: string } }) {
  try {
    const productId = String(params.productId ?? '').trim();
    if (!productId) return NextResponse.json({ ok: false, error: 'PRODUCT_ID_REQUIRED' }, { status: 400 });
    const truth = await getSellableCatalogTruth(productId);
    if (!truth) return NextResponse.json({ ok: false, error: 'PRODUCT_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ ok: true, version: 'V400.0.0', source: 'LIVE_POSTGRES_SELLABLE_CATALOG_AUTHORITY', truth }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SELLABLE_CATALOG_ERROR';
    return NextResponse.json({ ok: false, error: message }, { status: message === 'DATABASE_NOT_CONFIGURED' ? 503 : 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
