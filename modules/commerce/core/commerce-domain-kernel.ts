import { query } from '../../platform/db/postgres.ts';

export type CommerceHealth =
  | 'NO_ACTIVE_COMMERCE' | 'QUOTE_READY' | 'QUOTE_EXPIRED' | 'PAYMENT_FAILED'
  | 'RUNTIME_FAILED' | 'PAYMENT_WAITING' | 'CAPTURED_PAYMENT_NO_EXECUTION'
  | 'FULFILLMENT_BLOCKED' | 'FULFILLMENT_IN_PROGRESS' | 'SETTLEMENT_PENDING'
  | 'COMPLETION_PENDING' | 'COMPLETED' | 'REFUNDED' | 'ORDER_ACTIVE';

export async function commerceDomainSnapshot(input: { customerId?: string; orderId?: string } = {}) {
  const params: string[] = [];
  const where: string[] = [];
  if (input.customerId) { params.push(input.customerId); where.push(`customer_id=$${params.length}`); }
  if (input.orderId) { params.push(input.orderId); where.push(`order_id=$${params.length}`); }
  const filter = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const rows = await query<any>(`SELECT * FROM trust_commerce_domain_snapshot${filter} ORDER BY COALESCE(order_updated_at,quote_created_at,cart_updated_at) DESC NULLS LAST LIMIT 100`, params);
  const health = await query<any>(`SELECT commerce_health,count(*)::int AS count FROM trust_commerce_domain_snapshot${filter} GROUP BY commerce_health ORDER BY commerce_health`, params);
  return { rows: rows.rows, healthCounts: health.rows, version: 'V415.0.0' };
}

export async function assertCommerceOrderJourney(orderId: string) {
  const result = await query<any>(`SELECT * FROM trust_commerce_domain_snapshot WHERE order_id=$1 LIMIT 1`, [orderId]);
  return result.rows[0] ?? null;
}

export const GLOBAL_COMMERCE_DOMAIN_KERNEL_VERSION = 'V415.0.0';
