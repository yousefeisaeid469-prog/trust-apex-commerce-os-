import { NextRequest, NextResponse } from 'next/server';
import { queryCatalog } from '../../../modules/commerce/repository/catalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
  const q = request.nextUrl.searchParams.get('q') ?? undefined;
  const category = request.nextUrl.searchParams.get('category') ?? undefined;
  const merchant = request.nextUrl.searchParams.get('merchant') ?? undefined;
  const tag = request.nextUrl.searchParams.get('tag') ?? undefined;
  const minPrice = request.nextUrl.searchParams.get('minPrice');
  const maxPrice = request.nextUrl.searchParams.get('maxPrice');
  const inStock = request.nextUrl.searchParams.get('inStock') === 'true';
  const sort = request.nextUrl.searchParams.get('sort') as any;
  const page = Number(request.nextUrl.searchParams.get('page') ?? '1');
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '24');
  const result = await queryCatalog({ q, category, merchant, tag, minPrice: minPrice === null ? undefined : Number(minPrice), maxPrice: maxPrice === null ? undefined : Number(maxPrice), inStock, sort, page, limit });
  return NextResponse.json(
    { ok: true, items: result.items, total: result.total, page: result.page, pages: result.pages, sort: result.sort, filters: result.filters, facets: result.facets },
    { headers: { 'Cache-Control': 'no-store' } }
  );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'CATALOG_SEARCH_FAILED';
    const status = ['INVALID_MIN_PRICE','INVALID_MAX_PRICE','INVALID_PRICE_RANGE'].includes(message) ? 400 : 503;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
