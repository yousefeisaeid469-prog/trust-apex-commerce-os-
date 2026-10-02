import { query } from '../db/postgres';

export type CommerceCommandSnapshot = Record<string, unknown>;

export async function getCommerceCommandSnapshot(orderId: string, customerId?: string) {
  const r = await query<CommerceCommandSnapshot>(
    `select * from trust_commerce_command_snapshot where order_id=$1 ${customerId ? 'and customer_id=$2' : ''}`,
    customerId ? [orderId, customerId] : [orderId],
  );
  return r.rows[0] ?? null;
}

export async function listCommerceCommandSnapshots(input: { customerId?: string; limit?: number; status?: string }) {
  const limit = Math.min(Math.max(Number(input.limit ?? 50), 1), 200);
  const params: unknown[] = [];
  const filters: string[] = [];
  if (input.customerId) filters.push(`customer_id=$${params.push(input.customerId)}`);
  if (input.status) filters.push(`command_status=$${params.push(input.status)}`);
  params.push(limit);
  const where = filters.length ? `where ${filters.join(' and ')}` : '';
  return (await query<CommerceCommandSnapshot>(
    `select * from trust_commerce_command_snapshot ${where} order by created_at desc limit $${params.length}`,
    params,
  )).rows;
}
