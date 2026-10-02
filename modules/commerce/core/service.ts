/**
 * Canonical commerce contracts.
 *
 * Runtime commerce MUST use the durable checkout transaction under
 * modules/commerce/transactions/checkout.ts. The former in-memory catalog/order
 * implementation has intentionally been removed from the runtime surface.
 */
export type CartLine = { productId: string; qty: number; offerId?: string };
export type Customer = { id: string; name: string; email?: string };
export type OrderStatus = 'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded';
export type Order = {
  id: string;
  customerId: string;
  items: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

/** @deprecated Use modules/commerce/repository/catalog.ts. */
export async function getProduct(_id: string): Promise<never> {
  throw new Error('LEGACY_COMMERCE_PATH_DISABLED: use repository/catalog');
}
/** @deprecated Use modules/commerce/pricing/engine.ts. */
export async function priceCart(_lines: CartLine[]): Promise<never> {
  throw new Error('LEGACY_COMMERCE_PATH_DISABLED: use pricing/engine');
}
/** @deprecated Use modules/commerce/transactions/checkout.ts. */
export async function createOrder(_customerId: string, _lines: CartLine[]): Promise<never> {
  throw new Error('LEGACY_COMMERCE_PATH_DISABLED: use transactions/checkout');
}
/** @deprecated Use the durable order repository/services. */
export async function getOrder(_id: string): Promise<never> {
  throw new Error('LEGACY_COMMERCE_PATH_DISABLED: use durable order services');
}
/** @deprecated Use the durable order repository/services. */
export async function listOrders(): Promise<never> {
  throw new Error('LEGACY_COMMERCE_PATH_DISABLED: use durable order services');
}
/** @deprecated Use modules/commerce/orders/state.ts. */
export async function transitionOrder(_id: string, _nextStatus: OrderStatus): Promise<never> {
  throw new Error('LEGACY_COMMERCE_PATH_DISABLED: use orders/state');
}
