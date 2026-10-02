import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { withPgTransaction, databaseConfigured } from '../../../../modules/platform/db/postgres';
import { createOrder } from '../../../../modules/commerce/checkout/checkout';
import { planMarketplaceCheckout } from '../../../../modules/marketplace/checkout-planner';
import { createPaymentIntent } from '../../../../modules/commerce/payments/orchestrator';
import { getPaymentProviderReadiness } from '../../../../modules/platform/payments/provider-gate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!databaseConfigured()) return NextResponse.json({ ok: false, error: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    const body = await req.json();
    // Logged-in customers checkout under their account (card or COD).
    // Anonymous visitors can still complete a COD order as a guest — no
    // account required, since there's no payment credential to store.
    const user = await getCurrentUser(req);
    const key = req.headers.get('idempotency-key') ?? String(body?.idempotencyKey ?? '');
    const lines = Array.isArray(body?.items) ? body.items.map((item: { productId?: unknown; quantity?: unknown; offerId?: unknown }) => ({ productId: String(item.productId ?? ''), quantity: Number(item.quantity), ...(typeof item.offerId === 'string' && item.offerId.trim() ? { offerId: item.offerId.trim() } : {}) })) : [];
    const destinationRegion = typeof body?.destinationRegion === 'string' && body.destinationRegion.trim() ? body.destinationRegion.trim() : 'GLOBAL';
    const paymentMethod = body?.paymentMethod === 'card' ? 'card' : 'cod';
    const readiness = getPaymentProviderReadiness();
    if (paymentMethod === 'card' && !readiness.configured) {
      return NextResponse.json(
        { ok: false, surfaceStatus: 'PROVIDER_REQUIRED', error: readiness.reason, provider: readiness.provider },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const fulfillmentPlan = await planMarketplaceCheckout(lines.map((x:any) => ({ productId: x.productId, qty: x.quantity, offerId: x.offerId })), destinationRegion);
    const boundLines = fulfillmentPlan.items.map(item => ({ productId: item.productId, quantity: item.qty, offerId: item.offerId }));
    const result = await withPgTransaction(async (client) => {
      const order = await createOrder(client, {
        customerId: user?.id,
        guest: !user && body?.guest ? {
          name: String(body.guest.name ?? ''),
          phone: String(body.guest.phone ?? ''),
          address: String(body.guest.address ?? ''),
        } : undefined,
        lines: boundLines,
        shipping: Number(body?.shipping ?? 0),
        idempotencyKey: key,
        paymentMethod,
        discountCode: typeof body?.discountCode === 'string' ? body.discountCode : undefined,
        fulfillmentPlan,
      });
      let payment = null;
      if (paymentMethod === 'card') {
        if (!user?.id) throw new Error('BUYER_IDENTITY_REQUIRED');
        payment = await createPaymentIntent(
          { transaction: async work => work(client), query: (sql, params) => client.query(sql, params) },
          {
            orderId: order.id,
            customerId: user.id,
            provider: String(readiness.provider),
            amount: order.total,
            currency: order.currency,
            idempotencyKey: `checkout-payment:${key}`,
          },
        );
      }
      return { order, payment };
    });
    return NextResponse.json({ ok: true, ...result }, { status: result.order.idempotentReplay ? 200 : 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CHECKOUT_FAILED';
    const status = ['INVALID_CHECKOUT', 'INVALID_QUANTITY', 'INVALID_SHIPPING', 'PRODUCT_NOT_AVAILABLE', 'INSUFFICIENT_STOCK', 'BUYER_IDENTITY_REQUIRED', 'INVALID_GUEST_NAME', 'INVALID_GUEST_PHONE', 'INVALID_GUEST_ADDRESS', 'GUEST_CHECKOUT_REQUIRES_COD', 'QUOTE_PRICE_CHANGED', 'DESTINATION_REGION_REQUIRED', 'NO_MARKETPLACE_OFFER', 'OFFER_NOT_AVAILABLE', 'INSUFFICIENT_OFFER_STOCK', 'NO_FULFILLMENT_OPTION', 'FULFILLMENT_INVENTORY_UNAVAILABLE', 'FULFILLMENT_PLAN_MISMATCH'].includes(message) ? 400 : 409;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
