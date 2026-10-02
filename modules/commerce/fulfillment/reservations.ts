import { getProduct } from '../products/catalog';
import type { CartLine } from '../core/service';
import { recordInventoryEvent } from '../inventory-ledger/store';

export function reserveLines(lines: CartLine[]) {
  const products = lines.map(l => ({ line: l, product: getProduct(l.productId) }));
  if (products.some(x => !x.product || x.product.stock < x.line.qty)) throw new Error('INSUFFICIENT_STOCK');
  for (const { line, product } of products) { product!.stock -= line.qty; recordInventoryEvent({ productId: product!.id, delta: -line.qty, reason: 'order_reservation' }); }
  return products.map(x => ({ productId: x.product!.id, qty: x.line.qty }));
}
export function releaseLines(lines: CartLine[]) {
  for (const line of lines) { const product = getProduct(line.productId); if (!product) continue; product.stock += line.qty; recordInventoryEvent({ productId: product.id, delta: line.qty, reason: 'order_release' }); }
}
