import { NextRequest, NextResponse } from 'next/server';
import { searchMarketplace } from '../../../../modules/marketplace/discovery';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Canonical catalog search endpoint. It is database-backed and shares the same ranking
 * authority as /api/marketplace/search; this route no longer contains demo/static products.
 */
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const number = (key: string) => {
      const raw = p.get(key);
      if (raw === null || raw.trim() === '') return undefined;
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    };
    const session = request.cookies.get('trust_marketplace_session')?.value ?? randomUUID();
    const result = await searchMarketplace({
      sessionKey: session,
      q: p.get('q') ?? undefined,
      category: p.get('category') ?? undefined,
      merchant: p.get('merchant') ?? undefined,
      region: p.get('region') ?? undefined,
      tag: p.get('tag') ?? undefined,
      minPrice: number('minPrice'),
      maxPrice: number('maxPrice'),
      minRating: number('minRating'),
      inStock: p.get('inStock') === 'true',
      sort: (p.get('sort') as any) || 'relevance',
      page: number('page'),
      limit: number('limit'),
    });
    const response = NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
    if (!request.cookies.get('trust_marketplace_session')) {
      response.cookies.set('trust_marketplace_session', session, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 180,
        path: '/',
      });
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'CATALOG_SEARCH_FAILED' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
