import { createHash } from 'node:crypto';
import type { CartLine, OrderStatus } from './service';
import { query, withPgTransaction } from '../../platform/db/postgres';
import { priceCart as priceWithPromotion } from '../pricing/engine';
import { commitCanonicalCheckout } from './canonical-commerce-kernel';
import { planMarketplaceCheckout, type MarketplaceCheckoutPlan } from '../../marketplace/checkout-planner';

export type CheckoutQuote = Awaited<ReturnType<typeof priceWithPromotion>> & {
  discount: number;
  adjustments: { code: string; label: string; amount: number }[];
  quoteId: string;
  expiresAt: string;
  currency: 'EGP';
  items: CartLine[];
  fulfillmentPlan?: MarketplaceCheckoutPlan;
};

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [],
  cancelled: [], refunded: [],
};

function requestHash(lines: CartLine[], discountCode?: string, destinationRegion='GLOBAL', customerId?: string) {
  return createHash('sha256').update(JSON.stringify({ lines, discountCode: discountCode?.trim().toUpperCase() ?? null, destinationRegion, customerId: customerId ?? null })).digest('hex');
}

export async function createQuote(lines: CartLine[], ttlMs = 10 * 60_000, discountCode?: string, destinationRegion = 'GLOBAL', customerId?: string): Promise<CheckoutQuote> {
  if (!Number.isInteger(ttlMs) || ttlMs < 1_000 || ttlMs > 30 * 60_000) throw new Error('INVALID_QUOTE_TTL');
  const requested = lines.map(l => ({ productId: String(l.productId), qty: Number(l.qty), ...(l.offerId ? { offerId: String(l.offerId) } : {}) }));
  const fulfillmentPlan = await planMarketplaceCheckout(requested, destinationRegion);
  const normalized = fulfillmentPlan.items.map(item => ({ productId: item.productId, qty: item.qty, offerId: item.offerId }));
  const priced = await priceWithPromotion(normalized, discountCode, customerId, fulfillmentPlan.shipping);
  const fulfillmentShipping = (priced.subtotal - priced.discount) >= 1500 ? 0 : fulfillmentPlan.shipping;
  const finalPricing = { ...priced, shipping: fulfillmentShipping, total: Math.max(0, priced.subtotal - priced.discount + fulfillmentShipping) };
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const hash = requestHash(normalized, discountCode, destinationRegion, customerId);
  return withPgTransaction(async client => {
    const existing = await client.query<{id:string;pricing_json:any;items_json:any;currency:string;expires_at:string;consumed_at:string|null}>(
      `select id,pricing_json,items_json,currency,expires_at,consumed_at from trust_checkout_quotes where request_hash=$1 and customer_id is not distinct from $2 and consumed_at is null and expires_at>now() limit 1`, [hash, customerId ?? null]);
    if (existing.rows[0]) {
      const row = existing.rows[0];
      return { ...(row.pricing_json as object), quoteId: String(row.id), expiresAt: new Date(row.expires_at).toISOString(), currency: 'EGP', items: row.items_json as CartLine[], fulfillmentPlan: (row.pricing_json as any).fulfillmentPlan } as CheckoutQuote;
    }
    const inserted = await client.query<{id:string}>(
      `insert into trust_checkout_quotes(request_hash,items_json,pricing_json,currency,expires_at,discount_code,customer_id) values($1,$2::jsonb,$3::jsonb,'EGP',$4,$5,$6) returning id`,
      [hash, JSON.stringify(normalized), JSON.stringify({ ...finalPricing, fulfillmentPlan }), expiresAt, discountCode?.trim().toUpperCase() || null, customerId ?? null]);
    return { ...finalPricing, quoteId: String(inserted.rows[0].id), expiresAt, currency: 'EGP', items: normalized, fulfillmentPlan };
  });
}

export async function getQuote(quoteId: string): Promise<CheckoutQuote | undefined> {
  const result = await query<{pricing_json:any;items_json:any;expires_at:string;consumed_at:string|null}>(
    `select pricing_json,items_json,expires_at,consumed_at from trust_checkout_quotes where id=$1 and consumed_at is null and expires_at>now()`, [quoteId]);
  const row = result.rows[0];
  if (!row) return undefined;
  return { ...(row.pricing_json as object), quoteId, expiresAt: new Date(row.expires_at).toISOString(), currency: 'EGP', items: row.items_json as CartLine[], fulfillmentPlan: (row.pricing_json as any).fulfillmentPlan } as CheckoutQuote;
}

export async function placeOrderFromQuote(customerId: string, quoteId: string, idempotencyKey = `quote:${quoteId}`, paymentMethod: 'cod' | 'card' = 'cod') {
  return withPgTransaction(async client => {
    const row = (await client.query<{pricing_json:any;items_json:any;expires_at:string;consumed_at:string|null;discount_code:string|null;customer_id:string|null}>(
      `select pricing_json,items_json,expires_at,consumed_at,discount_code,customer_id from trust_checkout_quotes where id=$1 for update`, [quoteId])).rows[0];
    if (!row || row.consumed_at || Date.parse(row.expires_at) <= Date.now()) throw new Error('QUOTE_EXPIRED_OR_NOT_FOUND');
    if (row.customer_id && row.customer_id !== customerId) throw new Error('QUOTE_NOT_OWNED');
    const pricing=row.pricing_json as any;
    const order = await commitCanonicalCheckout(client, { customerId, lines: row.items_json as CartLine[], shipping: Number(pricing.shipping ?? 0), idempotencyKey, paymentMethod, discountCode: row.discount_code ?? undefined, pricingSnapshot: {subtotal:Number(pricing.subtotal),discount:Number(pricing.discount),shipping:Number(pricing.shipping),total:Number(pricing.total),currency:'EGP'}, fulfillmentPlan: pricing.fulfillmentPlan }, { quoteId });
    await client.query(`update trust_checkout_quotes set consumed_at=now() where id=$1`, [quoteId]);
    return order;
  });
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) { return transitions[from].includes(to); }
