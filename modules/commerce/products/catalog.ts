/**
 * @deprecated Legacy compatibility catalog.
 *
 * Active production catalog reads must use modules/commerce/repository/catalog.ts.
 * The data below exists only to keep the legacy in-memory commerce service
 * executable while that service is retired. It is not an authoritative source.
 */
import { products } from '../../../fixtures/catalog';
export { products };
export type { Product } from '../../../fixtures/catalog';
export { products as catalog };

export function getProduct(id: string) {
  return products.find(product => product.id === id);
}
