export type ID = string;

export type EntityMeta = {
  id: ID;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProductRecord = EntityMeta & {
  name: string;
  category: string;
  price: number;
  stock: number;
  merchantId: ID;
  status: 'active' | 'draft' | 'archived';
};

export type MerchantRecord = EntityMeta & {
  name: string;
  region: string;
  trustScore: number;
  status: 'active' | 'review' | 'suspended';
};

export type OrderRecord = EntityMeta & {
  customerId: ID;
  total: number;
  currency: 'EGP' | 'USD';
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
  lineCount: number;
};

export type DataCoreSnapshot = {
  generatedAt: string;
  counts: { products: number; merchants: number; orders: number };
  health: { repositories: 'healthy' | 'degraded'; consistency: 'strong' | 'eventual'; persistence: 'demo' | 'production' };
  domains: string[];
};
