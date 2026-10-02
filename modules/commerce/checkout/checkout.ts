import type { PoolClient } from 'pg';
import { commitCheckout, type CheckoutInput, type CommittedOrder } from '../transactions/checkout';
import type { CartLine } from '../core/service';
import { priceCart } from '../pricing/engine';
export { commitCheckout };
export type { CheckoutInput, CommittedOrder };
export async function prepareCheckout(lines: CartLine[], discountCode?: string) {
  if (!Array.isArray(lines) || !lines.length) throw new Error('INVALID_CHECKOUT');
  if (lines.some(l => !l.productId || !Number.isInteger(l.qty) || l.qty < 1)) throw new Error('INVALID_QUANTITY');
  const priced = await priceCart(lines, discountCode);
  return { ...priced, eligibleForFreeShipping: priced.shipping === 0, requiresPaymentProvider: true, checkoutReady: true };
}
export async function createOrder(client: PoolClient, input: CheckoutInput): Promise<CommittedOrder> { return commitCheckout(client, input); }
