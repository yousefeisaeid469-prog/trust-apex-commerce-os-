import { NextRequest, NextResponse } from 'next/server';
import { createQuote } from '../../../modules/commerce/core/engine';
import { getCurrentUser, AuthRequiredError } from '../../../modules/platform/auth/current-user';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw new AuthRequiredError();
    const body = await req.json();
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ ok: false, error: 'items must be a non-empty array' }, { status: 400 });
    }
    const quote = await createQuote(body.items, 10 * 60_000, typeof body.discountCode === 'string' ? body.discountCode : undefined, typeof body.destinationRegion === 'string' ? body.destinationRegion : 'GLOBAL', user.id);
    return NextResponse.json({ ok: true, checkout: quote }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AuthRequiredError) return NextResponse.json({ ok: false, error: error.message }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    const message = error instanceof Error ? error.message : 'Invalid checkout request';
    return NextResponse.json({ ok: false, error: message }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
