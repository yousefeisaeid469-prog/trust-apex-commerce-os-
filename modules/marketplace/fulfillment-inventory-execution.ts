import type { PoolClient } from 'pg';
import { shipInventoryTransactionTx } from '../commerce/inventory/transaction-engine.ts';

/**
 * V354: consumes the physical fulfillment inventory represented by allocations.
 * This is deliberately separate from checkout reservation: checkout moves
 * available -> reserved (or consumes availability for COD), while handoff
 * moves the reserved/on-hand inventory out of the fulfillment location.
 */
export async function executeFulfillmentHandoffTx(tx: PoolClient, input: {
  fulfillmentOrderId: string;
  merchantId: string;
  idempotencyKey: string;
}) {
  const fulfillment = (await tx.query<any>(
    `select id,status,merchant_id from trust_marketplace_fulfillment_orders
      where id=$1 and merchant_id=$2 for update`,
    [input.fulfillmentOrderId, input.merchantId],
  )).rows[0];
  if (!fulfillment) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');

  const allocations = (await tx.query<any>(
    `select a.*,r.status reservation_status
       from trust_fulfillment_allocations a
       join trust_inventory_reservations r on r.id=a.reservation_id
      where a.fulfillment_order_id=$1
      order by a.id
      for update of a,r`,
    [fulfillment.id],
  )).rows;
  if (!allocations.length) throw new Error('FULFILLMENT_ALLOCATIONS_MISSING');

  let executed = 0;
  let replayed = 0;

  for (const allocation of allocations) {
    if (['RELEASED', 'EXPIRED', 'CANCELLED'].includes(String(allocation.status))) {
      throw new Error(`ALLOCATION_NOT_HANDOFFABLE:${allocation.status}`);
    }
    if (String(allocation.status) !== 'PACKED') {
      throw new Error(`ALLOCATION_NOT_PACKED:${allocation.status}`);
    }
    if (!['reserved', 'consumed'].includes(String(allocation.reservation_status))) {
      throw new Error(`RESERVATION_NOT_EXECUTABLE:${allocation.reservation_status}`);
    }

    const existing = (await tx.query<any>(
      `select id from trust_fulfillment_inventory_executions
        where allocation_id=$1 and execution_type='HANDOFF_SHIP'
        for update`,
      [allocation.id],
    )).rows[0];
    if (existing) {
      replayed += 1;
      continue;
    }

    if (!allocation.location_id) throw new Error('ALLOCATION_LOCATION_REQUIRED_FOR_HANDOFF');
    const quantity = Number(allocation.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('INVALID_ALLOCATION_QUANTITY');

    await shipInventoryTransactionTx(tx, {
      productId: String(allocation.product_id),
      offerId: allocation.offer_id ? String(allocation.offer_id) : undefined,
      locationId: String(allocation.location_id),
      reservationId: String(allocation.reservation_id),
      fulfillmentOrderId: String(fulfillment.id),
      quantity,
      idempotencyKey: `${input.idempotencyKey}:allocation:${allocation.id}:ship`,
      source: 'FULFILLMENT_HANDOFF',
      metadata: { reservationStatus: String(allocation.reservation_status) },
    });

    const movementRow = (await tx.query<any>(
      `select id from trust_marketplace_inventory_movements where reference_key=$1`,
      [`${input.idempotencyKey}:allocation:${allocation.id}:ship:movement`],
    )).rows[0];
    if (!movementRow) throw new Error('INVENTORY_MOVEMENT_CREATE_FAILED');

    await tx.query(
      `insert into trust_fulfillment_inventory_executions
        (allocation_id,fulfillment_order_id,reservation_id,location_id,offer_id,product_id,quantity,execution_type,idempotency_key,inventory_movement_id)
       values($1,$2,$3,$4,$5,$6,$7,'HANDOFF_SHIP',$8,$9)`,
      [allocation.id, fulfillment.id, allocation.reservation_id, allocation.location_id,
        allocation.offer_id ?? null, allocation.product_id, quantity,
        `${input.idempotencyKey}:allocation:${allocation.id}`, movementRow.id],
    );
    executed += 1;
  }

  await tx.query(
    `insert into trust_outbox_events(event_type,aggregate_id,payload_json)
     values('marketplace.fulfillment.inventory_executed',$1,$2::jsonb)`,
    [fulfillment.id, JSON.stringify({ fulfillmentOrderId: fulfillment.id, executed, replayed, executionType: 'HANDOFF_SHIP' })],
  );

  return { fulfillmentOrderId: String(fulfillment.id), executed, replayed, total: allocations.length };
}
