import { cartSummary } from '../cart/store';
import { query } from '../../platform/db/postgres';

export type CommercialJourney = {
  cart: Awaited<ReturnType<typeof cartSummary>>;
  checkout: {
    ready: boolean;
    blockers: string[];
    itemCount: number;
    sellerCount: number;
    next: 'CART_EMPTY'|'REFRESH_CART'|'CHECKOUT_READY';
  };
};

export async function getCommercialJourney(customerId: string): Promise<CommercialJourney> {
  const cart = await cartSummary(customerId);
  const blockers: string[] = [];
  if (cart.cart.items.length === 0) blockers.push('CART_EMPTY');
  if (cart.invalidLines > 0 || cart.stockWarnings.length > 0) blockers.push('REFRESH_CART');

  const sellerIds = [...new Set(cart.items.map((item: any) => item.sellerId).filter(Boolean).map(String))];
  // Keep seller count authoritative to the current cart/offer state; no UI-only estimate.
  if (sellerIds.length === 0 && cart.cart.items.length > 0) {
    const ids = cart.cart.items.map((x: any) => x.offerId).filter(Boolean);
    if (ids.length) {
      const rows = await query<{merchant_id:string}>(`select distinct merchant_id from trust_marketplace_offers where id = any($1::uuid[])`, [ids]);
      sellerIds.push(...rows.rows.map(r => String(r.merchant_id)));
    }
  }

  const ready = blockers.length === 0;
  return {
    cart,
    checkout: {
      ready,
      blockers,
      itemCount: cart.items.reduce((n: number, item: any) => n + Number(item.qty || 0), 0),
      sellerCount: sellerIds.length,
      next: cart.cart.items.length === 0 ? 'CART_EMPTY' : ready ? 'CHECKOUT_READY' : 'REFRESH_CART',
    },
  };
}
