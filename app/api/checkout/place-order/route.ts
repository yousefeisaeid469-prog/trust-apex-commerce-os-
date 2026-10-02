import { NextRequest, NextResponse } from 'next/server';
import { placeOrderFromQuote } from '../../../../modules/commerce/core/engine';
import { getCurrentUser, AuthRequiredError } from '../../../../modules/platform/auth/current-user';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Converts a server-authoritative checkout quote into exactly one order.
 * The quote is locked and consumed transactionally; the idempotency key is
 * forwarded to the order commit so retries cannot create duplicate orders.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw new AuthRequiredError();

    const body = await req.json();
    const quoteId = typeof body?.quoteId === 'string' ? body.quoteId.trim() : '';
    const idempotencyKey = req.headers.get('idempotency-key')?.trim() ||
      (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '');

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: 'QUOTE_ID_REQUIRED' }, { status: 400 });
    }
    if (!idempotencyKey) {
      return NextResponse.json({ ok: false, error: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
    }
    if (idempotencyKey.length > 200) {
      return NextResponse.json({ ok: false, error: 'IDEMPOTENCY_KEY_TOO_LONG' }, { status: 400 });
    }

    const order = await placeOrderFromQuote(user.id, quoteId, idempotencyKey);
    return NextResponse.json(
      { ok: true, order },
      { status: order.idempotentReplay ? 200 : 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'ORDER_CREATION_FAILED';
    const status = message === 'DATABASE_NOT_CONFIGURED' ? 503 :
      ['QUOTE_EXPIRED_OR_NOT_FOUND', 'QUOTE_NOT_OWNED', 'QUOTE_PRICE_CHANGED', 'PRODUCT_NOT_AVAILABLE', 'INSUFFICIENT_STOCK', 'INSUFFICIENT_OFFER_STOCK'].includes(message) ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
