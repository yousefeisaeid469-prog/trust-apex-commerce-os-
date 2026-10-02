import { productRepository, merchantRepository, orderRepository } from './store';
import { DataCoreSnapshot } from './types';

export async function getDataCoreSnapshot(): Promise<DataCoreSnapshot> {
  const [products, merchants, orders] = await Promise.all([
    productRepository.list(), merchantRepository.list(), orderRepository.list(),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    counts: { products: products.length, merchants: merchants.length, orders: orders.length },
    health: {
      repositories: 'healthy',
      consistency: 'eventual',
      persistence: process.env.DATABASE_URL ? 'production' : 'demo',
    },
    domains: ['customers','merchants','catalog','inventory','orders','payments','trust','analytics','events','audit'],
  };
}
