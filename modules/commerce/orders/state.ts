import type { PoolClient } from 'pg';
import { queueOrderStatusNotificationsTx } from '../../platform/notifications-3';

export type DurableOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

const transitions: Record<DurableOrderStatus, readonly DurableOrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function canTransitionOrderStatus(from: DurableOrderStatus, to: DurableOrderStatus) {
  return from === to || transitions[from].includes(to);
}

export async function transitionDurableOrder(
  client: PoolClient,
  input: { orderId: string; to: DurableOrderStatus; actorId?: string; source: string; note?: string },
) {
  const row = (await client.query<{ id: string; status: DurableOrderStatus; customer_id: string | null }>(
    'select id,status,customer_id from trust_orders where id=$1 for update', [input.orderId],
  )).rows[0];
  if (!row) throw new Error('ORDER_NOT_FOUND');
  if (!canTransitionOrderStatus(row.status, input.to)) throw new Error(`INVALID_ORDER_TRANSITION:${row.status}->${input.to}`);
  if (row.status === input.to) return { id: row.id, from: row.status, to: row.status, changed: false };

  await client.query('update trust_orders set status=$2,updated_at=now() where id=$1', [input.orderId, input.to]);
  await client.query(
    `insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,$3,$4,$5)`,
    [input.orderId, row.status, input.to, input.source, input.note ?? null],
  );
  if (row.customer_id) {
    await queueOrderStatusNotificationsTx(client, { orderId: input.orderId, customerId: row.customer_id, status: input.to });
  }
  await client.query(
    `insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('order.status_changed',$1,$2::jsonb)`,
    [input.orderId, JSON.stringify({ from: row.status, to: input.to, source: input.source, actorId: input.actorId ?? null })],
  );
  return { id: row.id, from: row.status, to: input.to, changed: true };
}
