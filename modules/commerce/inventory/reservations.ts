import type { PoolClient } from 'pg';
import { reserveInventoryTransactionTx, releaseInventoryTransactionTx } from './transaction-engine.ts';

export type ReservationStatus = 'reserved' | 'released' | 'consumed' | 'expired';

type ReservationRow = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  status: ReservationStatus;
  expires_at: string;
  offer_id: string | null;
  location_id: string | null;
};

async function restoreStockTx(tx: PoolClient, row: ReservationRow) {
  const result = await releaseInventoryTransactionTx(tx, {
    productId: row.product_id,
    offerId: row.offer_id ?? undefined,
    locationId: row.location_id ?? undefined,
    orderId: row.order_id,
    reservationId: row.id,
    quantity: row.quantity,
    idempotencyKey: `inventory:release:${row.id}`,
    source: `reservation:${row.status.toUpperCase()}`,
    metadata: { reservationStatus: row.status },
  });
  return result;
}

async function lifecycleEventTx(tx: PoolClient, row: ReservationRow, eventType: 'RESERVED'|'CONSUMED'|'RELEASED'|'EXPIRED', reason: string | null) {
  const key = `inventory-reservation:${row.id}:${eventType}`;
  await tx.query(
    `INSERT INTO trust_inventory_reservation_events
      (reservation_id,order_id,event_type,quantity,reason,idempotency_key)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(idempotency_key) DO NOTHING`,
    [row.id, row.order_id, eventType, row.quantity, reason, key],
  );
}



export type ReserveInventoryInput = {
  orderId: string;
  productId: string;
  quantity: number;
  offerId?: string;
  locationId?: string;
  orderItemId?: string;
  status: 'reserved' | 'consumed';
};

/**
 * Single inventory reservation authority used by every checkout path.
 * It locks the exact stock bucket, decrements it once, creates the durable
 * reservation and emits the lifecycle event in the same transaction.
 */
export async function reserveInventoryTx(tx: PoolClient, input: ReserveInventoryInput) {
  if (!input.orderId || !input.productId || !Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error('INVALID_INVENTORY_RESERVATION');
  }
  const reservationStatus = input.status;
  const expiresSql = reservationStatus === 'reserved' ? `now()+interval '30 minutes'` : `now()`;

  const transactionKey = `inventory:reserve:${input.orderId}:${input.orderItemId ?? input.productId}:${input.offerId ?? 'product'}`;
  const transaction = await reserveInventoryTransactionTx(tx, {
    productId: input.productId,
    offerId: input.offerId,
    locationId: input.locationId,
    orderId: input.orderId,
    quantity: input.quantity,
    idempotencyKey: transactionKey,
    source: 'CHECKOUT_RESERVATION',
    metadata: { orderItemId: input.orderItemId ?? null, reservationStatus },
  });
  if (transaction.replay) {
    const existing = (await tx.query<{id:string;status:ReservationStatus}>(
      `SELECT id,status FROM trust_inventory_reservations WHERE order_id=$1 AND product_id=$2
         AND offer_id IS NOT DISTINCT FROM $3 AND order_item_id IS NOT DISTINCT FROM $4
       ORDER BY created_at DESC LIMIT 1`,
      [input.orderId,input.productId,input.offerId ?? null,input.orderItemId ?? null],
    )).rows[0];
    if (existing) return { reservationId: String(existing.id), status: existing.status };
  }

  const reservation = (await tx.query<ReservationRow>(
    `INSERT INTO trust_inventory_reservations(order_id,product_id,quantity,status,expires_at,offer_id,location_id,order_item_id)
     VALUES($1,$2,$3,$4,${expiresSql},$5,$6,$7)
     RETURNING id,order_id,product_id,quantity,status,expires_at,offer_id,location_id`,
    [input.orderId, input.productId, input.quantity, reservationStatus, input.offerId ?? null, input.locationId ?? null, input.orderItemId ?? null])).rows[0];
  if (!reservation) throw new Error('INVENTORY_RESERVATION_FAILED');

  await lifecycleEventTx(tx, reservation, reservationStatus === 'reserved' ? 'RESERVED' : 'CONSUMED',
    reservationStatus === 'reserved' ? 'CHECKOUT_RESERVED' : 'COD_CHECKOUT_CONSUMED');

  return { reservationId: String(reservation.id), status: reservationStatus };
}

export async function consumeOrderReservationsTx(tx: PoolClient, orderId: string) {
  const rows = (await tx.query<ReservationRow>(
    `SELECT id,order_id,product_id,quantity,status,expires_at,offer_id,location_id
       FROM trust_inventory_reservations
      WHERE order_id=$1 AND status='reserved'
      ORDER BY id
      FOR UPDATE`,
    [orderId],
  )).rows;
  for (const row of rows) {
    await tx.query(
      `UPDATE trust_inventory_reservations
          SET status='consumed',consumed_at=coalesce(consumed_at,now()),updated_at=now()
        WHERE id=$1`,
      [row.id],
    );
    await lifecycleEventTx(tx, row, 'CONSUMED', 'PAYMENT_CAPTURED');
  }
  return { orderId, consumed: rows.length };
}

export async function releaseOrderReservationsForCancellationTx(tx: PoolClient, orderId: string, reason = 'ORDER_CANCELLED') {
  const rows = (await tx.query<ReservationRow>(
    `SELECT id,order_id,product_id,quantity,status,expires_at,offer_id,location_id
       FROM trust_inventory_reservations
      WHERE order_id=$1 AND status IN ('reserved','consumed')
      ORDER BY id
      FOR UPDATE`,
    [orderId],
  )).rows;

  for (const row of rows) {
    // Restore the exact inventory bucket that was decremented at checkout.
    // This is row-id scoped so multiple reservations for the same product
    // cannot release the same stock twice.
    await restoreStockTx(tx, row);
    const updated = await tx.query(
      `UPDATE trust_inventory_reservations
          SET status='released',released_at=now(),release_reason=$2,updated_at=now()
        WHERE id=$1 AND status IN ('reserved','consumed')
        RETURNING id`,
      [row.id, reason.slice(0, 500)],
    );
    if (updated.rowCount === 1) {
      await lifecycleEventTx(tx, row, 'RELEASED', reason);
    }
  }
  return { orderId, released: rows.length };
}

export async function releaseOrderReservationsTx(tx: PoolClient, orderId: string, reason: string) {
  const rows = (await tx.query<ReservationRow>(
    `SELECT id,order_id,product_id,quantity,status,expires_at,offer_id,location_id
       FROM trust_inventory_reservations
      WHERE order_id=$1 AND status='reserved'
      ORDER BY id
      FOR UPDATE`,
    [orderId],
  )).rows;
  for (const row of rows) {
    await restoreStockTx(tx, row);
    await tx.query(
      `UPDATE trust_inventory_reservations
          SET status='released',released_at=now(),release_reason=$2,updated_at=now()
        WHERE id=$1`,
      [row.id, reason.slice(0, 500)],
    );
    await lifecycleEventTx(tx, row, 'RELEASED', reason);
  }
  return { orderId, released: rows.length };
}

export async function expireInventoryReservationsTx(tx: PoolClient, limit = 500) {
  const safeLimit = Math.max(1, Math.min(5000, Math.trunc(limit)));
  const rows = (await tx.query<ReservationRow>(
    `SELECT id,order_id,product_id,quantity,status,expires_at,offer_id,location_id
       FROM trust_inventory_reservations
      WHERE status='reserved' AND expires_at<=now()
      ORDER BY expires_at,id
      FOR UPDATE SKIP LOCKED
      LIMIT $1`,
    [safeLimit],
  )).rows;
  for (const row of rows) {
    await restoreStockTx(tx, row);
    await tx.query(
      `UPDATE trust_inventory_reservations
          SET status='expired',released_at=now(),release_reason='RESERVATION_EXPIRED',updated_at=now()
        WHERE id=$1 AND status='reserved'`,
      [row.id],
    );
    await lifecycleEventTx(tx, row, 'EXPIRED', 'RESERVATION_EXPIRED');
    await tx.query(
      `INSERT INTO trust_outbox_events(event_type,aggregate_id,payload_json)
       VALUES('inventory.reservation.expired',$1,$2::jsonb)`,
      [row.order_id, JSON.stringify({ orderId: row.order_id, reservationId: row.id, quantity: row.quantity })],
    );
  }
  return { scanned: rows.length, expired: rows.length };
}
