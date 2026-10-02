import { createHash } from 'crypto';
import type { PoolClient } from 'pg';

type TxType = 'RESERVE' | 'RELEASE' | 'SHIP' | 'RETURN' | 'INBOUND' | 'ADJUSTMENT';

type Common = {
  productId: string;
  offerId?: string;
  locationId?: string;
  orderId?: string;
  reservationId?: string;
  fulfillmentOrderId?: string;
  quantity: number;
  idempotencyKey: string;
  source: string;
  metadata?: Record<string, unknown>;
};

const requestHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const qty = (value: unknown) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error('INVALID_INVENTORY_TRANSACTION_QUANTITY');
  return n;
};

async function beginTx(tx: PoolClient, input: Common, transactionType: TxType) {
  const q = await tx.query<{ id: string }>(
    `INSERT INTO trust_inventory_transactions
      (transaction_type,product_id,offer_id,location_id,order_id,reservation_id,fulfillment_order_id,quantity,source,idempotency_key,metadata_json)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
     ON CONFLICT(idempotency_key) DO NOTHING
     RETURNING id`,
    [transactionType,input.productId,input.offerId??null,input.locationId??null,input.orderId??null,
      input.reservationId??null,input.fulfillmentOrderId??null,input.quantity,input.source,input.idempotencyKey,
      JSON.stringify(input.metadata??{})],
  );
  if (!q.rows[0]) return { replay: true, id: null as string | null };
  return { replay: false, id: String(q.rows[0].id) };
}


async function receipt(tx: PoolClient, input: { commandType: string; aggregateType: string; aggregateId: string; idempotencyKey: string; requestHash: string; result: unknown; actorId?: string }) {
  await tx.query(
    `INSERT INTO trust_command_receipts(command_type,aggregate_type,aggregate_id,idempotency_key,request_hash,status,actor_id,result_json)
     VALUES($1,$2,$3,$4,$5,'SUCCEEDED',$6,$7::jsonb)
     ON CONFLICT(command_type,idempotency_key) DO NOTHING`,
    [input.commandType,input.aggregateType,input.aggregateId,input.idempotencyKey,input.requestHash,input.actorId??null,JSON.stringify(input.result)],
  );
}

async function ledger(tx: PoolClient, productId: string, delta: number, reason: string, referenceId?: string) {
  await tx.query(
    `INSERT INTO trust_inventory_ledger(product_id,delta,reason,reference_id)
     VALUES($1,$2,$3,$4)`,
    [productId,delta,reason,referenceId??null],
  );
}

/**
 * V402 canonical transaction boundary for inventory state changes.
 * Every mutation first claims a unique idempotency key inside the caller's
 * PostgreSQL transaction, then mutates the exact inventory authority.
 */
export async function reserveInventoryTransactionTx(tx: PoolClient, input: Common) {
  const amount = qty(input.quantity);
  const claim = await beginTx(tx,{...input,quantity:amount},'RESERVE');
  if (claim.replay) return { replay: true, transactionId: null as string|null };

  if (input.offerId) {
    const offer = (await tx.query<any>(
      `SELECT id,product_id,stock,status FROM trust_marketplace_offers WHERE id=$1 AND product_id=$2 FOR UPDATE`,
      [input.offerId,input.productId],
    )).rows[0];
    if (!offer || offer.status !== 'ACTIVE') throw new Error('OFFER_NOT_AVAILABLE');
    if (Number(offer.stock) < amount) throw new Error('INSUFFICIENT_OFFER_STOCK');

    if (input.locationId) {
      const inv = (await tx.query<any>(
        `SELECT available_units FROM trust_fulfillment_inventory
          WHERE offer_id=$1 AND location_id=$2 AND product_id=$3 FOR UPDATE`,
        [input.offerId,input.locationId,input.productId],
      )).rows[0];
      if (!inv || Number(inv.available_units) < amount) throw new Error('FULFILLMENT_INVENTORY_UNAVAILABLE');
      const isReserved = input.metadata?.reservationStatus !== 'consumed';
      await tx.query(
        isReserved
          ? `UPDATE trust_fulfillment_inventory
               SET available_units=available_units-$1,reserved_units=reserved_units+$1,updated_at=now()
             WHERE offer_id=$2 AND location_id=$3 AND product_id=$4`
          : `UPDATE trust_fulfillment_inventory
               SET available_units=available_units-$1,updated_at=now()
             WHERE offer_id=$2 AND location_id=$3 AND product_id=$4`,
        [amount,input.offerId,input.locationId,input.productId],
      );
    }
    await tx.query(`UPDATE trust_marketplace_offers SET stock=stock-$1,updated_at=now() WHERE id=$2`,[amount,input.offerId]);
  } else {
    const product=(await tx.query<any>(`SELECT id,stock,active FROM trust_products WHERE id=$1 FOR UPDATE`,[input.productId])).rows[0];
    if (!product || !product.active) throw new Error('PRODUCT_NOT_AVAILABLE');
    if (Number(product.stock) < amount) throw new Error('INSUFFICIENT_STOCK');
    await tx.query(`UPDATE trust_products SET stock=stock-$1,updated_at=now() WHERE id=$2`,[amount,input.productId]);
  }
  await ledger(tx,input.productId,-amount,'inventory_transaction_reserve',input.orderId);
  await receipt(tx,{commandType:'inventory.reserve',aggregateType:'product',aggregateId:input.productId,idempotencyKey:input.idempotencyKey,requestHash:requestHash(input),result:{transactionId:claim.id,quantity:amount}});
  return { replay:false, transactionId:claim.id };
}

export async function releaseInventoryTransactionTx(tx: PoolClient, input: Common) {
  const amount = qty(input.quantity);
  const claim=await beginTx(tx,{...input,quantity:amount},'RELEASE');
  if (claim.replay) return { replay:true, transactionId:null as string|null };

  if (input.offerId) {
    await tx.query(`UPDATE trust_marketplace_offers SET stock=stock+$1,updated_at=now() WHERE id=$2`,[amount,input.offerId]);
    if (input.locationId) {
      const wasReserved = input.metadata?.reservationStatus !== 'consumed';
      await tx.query(
        wasReserved
          ? `UPDATE trust_fulfillment_inventory
               SET available_units=available_units+$1,reserved_units=GREATEST(0,reserved_units-$1),updated_at=now()
             WHERE offer_id=$2 AND location_id=$3 AND product_id=$4`
          : `UPDATE trust_fulfillment_inventory
               SET available_units=available_units+$1,updated_at=now()
             WHERE offer_id=$2 AND location_id=$3 AND product_id=$4`,
        [amount,input.offerId,input.locationId,input.productId],
      );
    }
  } else {
    await tx.query(`UPDATE trust_products SET stock=stock+$1,updated_at=now() WHERE id=$2`,[amount,input.productId]);
  }
  await ledger(tx,input.productId,amount,'inventory_transaction_release',input.orderId);
  await receipt(tx,{commandType:'inventory.release',aggregateType:'product',aggregateId:input.productId,idempotencyKey:input.idempotencyKey,requestHash:requestHash(input),result:{transactionId:claim.id,quantity:amount}});
  return { replay:false, transactionId:claim.id };
}

export async function shipInventoryTransactionTx(tx: PoolClient, input: Common) {
  const amount=qty(input.quantity);
  if (!input.locationId) throw new Error('INVENTORY_LOCATION_REQUIRED_FOR_SHIP');
  const claim=await beginTx(tx,{...input,quantity:amount},'SHIP');
  if (claim.replay) return { replay:true, transactionId:null as string|null };

  const inv=(await tx.query<any>(
    `SELECT reserved_units,on_hand_units FROM trust_fulfillment_inventory
      WHERE location_id=$1 AND product_id=$2 AND offer_id IS NOT DISTINCT FROM $3 FOR UPDATE`,
    [input.locationId,input.productId,input.offerId??null],
  )).rows[0];
  if (!inv || Number(inv.on_hand_units)<amount) throw new Error('FULFILLMENT_ON_HAND_INSUFFICIENT');
  const wasReserved = input.metadata?.reservationStatus !== 'consumed';
  if (wasReserved && Number(inv.reserved_units)<amount) throw new Error('FULFILLMENT_RESERVED_INSUFFICIENT');

  await tx.query(
    wasReserved
      ? `UPDATE trust_fulfillment_inventory
           SET reserved_units=reserved_units-$1,on_hand_units=on_hand_units-$1,updated_at=now()
         WHERE location_id=$2 AND product_id=$3 AND offer_id IS NOT DISTINCT FROM $4`
      : `UPDATE trust_fulfillment_inventory
           SET on_hand_units=on_hand_units-$1,updated_at=now()
         WHERE location_id=$2 AND product_id=$3 AND offer_id IS NOT DISTINCT FROM $4`,
    [amount,input.locationId,input.productId,input.offerId??null],
  );
  await tx.query(
    `INSERT INTO trust_marketplace_inventory_movements
      (location_id,offer_id,product_id,movement_type,quantity,reference_key,note)
     VALUES($1,$2,$3,'SHIP',$4,$5,$6)`,
    [input.locationId,input.offerId??null,input.productId,-amount,`${input.idempotencyKey}:movement`,`V402 inventory transaction ${input.fulfillmentOrderId??''}`],
  );
  await ledger(tx,input.productId,-amount,'inventory_transaction_ship',input.fulfillmentOrderId);
  await receipt(tx,{commandType:'inventory.ship',aggregateType:'product',aggregateId:input.productId,idempotencyKey:input.idempotencyKey,requestHash:requestHash(input),result:{transactionId:claim.id,quantity:amount}});
  return { replay:false, transactionId:claim.id };
}

export async function receiveInventoryTransactionTx(tx: PoolClient, input: Common) {
  const amount=qty(input.quantity);
  if (!input.locationId) throw new Error('INVENTORY_LOCATION_REQUIRED_FOR_INBOUND');
  const claim=await beginTx(tx,{...input,quantity:amount},'INBOUND');
  if (claim.replay) return { replay:true, transactionId:null as string|null };
  const inv=(await tx.query<any>(
    `SELECT location_id FROM trust_fulfillment_inventory
      WHERE location_id=$1 AND product_id=$2 AND offer_id IS NOT DISTINCT FROM $3 FOR UPDATE`,
    [input.locationId,input.productId,input.offerId??null],
  )).rows[0];
  if (!inv) throw new Error('FULFILLMENT_INVENTORY_NOT_FOUND');
  await tx.query(
    `INSERT INTO trust_marketplace_inventory_movements
      (location_id,offer_id,product_id,movement_type,quantity,reference_key,note)
     VALUES($1,$2,$3,'INBOUND_RECEIPT',$4,$5,$6)`,
    [input.locationId,input.offerId??null,input.productId,amount,input.idempotencyKey,String(input.metadata?.note??'V402 inbound transaction')],
  );
  await tx.query(
    `UPDATE trust_fulfillment_inventory
        SET available_units=available_units+$1,on_hand_units=on_hand_units+$1,
            inbound_units=GREATEST(0,inbound_units-$1),updated_at=now()
      WHERE location_id=$2 AND product_id=$3 AND offer_id IS NOT DISTINCT FROM $4`,
    [amount,input.locationId,input.productId,input.offerId??null],
  );
  await ledger(tx,input.productId,amount,'inventory_transaction_inbound',input.fulfillmentOrderId);
  await receipt(tx,{commandType:'inventory.inbound',aggregateType:'product',aggregateId:input.productId,idempotencyKey:input.idempotencyKey,requestHash:requestHash(input),result:{transactionId:claim.id,quantity:amount}});
  return { replay:false, transactionId:claim.id };
}



/**
 * V403 controlled adjustment boundary for non-order inventory changes.
 * This is intentionally separate from RESERVE/RELEASE so seller/admin edits,
 * returns and recovery flows remain observable in the same immutable journal.
 */
export async function adjustInventoryTransactionTx(tx: PoolClient, input: Common & { delta: number; transactionType?: 'ADJUSTMENT' | 'RETURN' }) {
  const delta = Number(input.delta);
  if (!Number.isInteger(delta) || delta === 0) throw new Error('INVALID_INVENTORY_ADJUSTMENT');
  const amount = Math.abs(delta);
  const transactionType = input.transactionType ?? 'ADJUSTMENT';
  const claim = await beginTx(tx, { ...input, quantity: amount }, transactionType);
  if (claim.replay) return { replay: true, transactionId: null as string | null, delta };

  if (input.offerId) {
    const offer = (await tx.query<any>(
      `SELECT id,product_id,stock,status FROM trust_marketplace_offers WHERE id=$1 AND product_id=$2 FOR UPDATE`,
      [input.offerId, input.productId],
    )).rows[0];
    if (!offer) throw new Error('OFFER_NOT_FOUND');
    if (delta < 0 && Number(offer.stock) < amount) throw new Error('INSUFFICIENT_OFFER_STOCK');
    await tx.query(
      `UPDATE trust_marketplace_offers SET stock=stock+$1,updated_at=now() WHERE id=$2`,
      [delta, input.offerId],
    );
  } else {
    const product = (await tx.query<any>(
      `SELECT id,stock,active FROM trust_products WHERE id=$1 FOR UPDATE`,
      [input.productId],
    )).rows[0];
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    if (delta < 0 && Number(product.stock) < amount) throw new Error('INSUFFICIENT_STOCK');
    await tx.query(`UPDATE trust_products SET stock=stock+$1,updated_at=now() WHERE id=$2`, [delta, input.productId]);
  }

  if (input.locationId) {
    const inv = (await tx.query<any>(
      `SELECT available_units,on_hand_units FROM trust_fulfillment_inventory
       WHERE location_id=$1 AND product_id=$2 AND offer_id IS NOT DISTINCT FROM $3 FOR UPDATE`,
      [input.locationId, input.productId, input.offerId ?? null],
    )).rows[0];
    if (inv) {
      if (delta < 0 && Number(inv.available_units) < amount) throw new Error('FULFILLMENT_AVAILABLE_INSUFFICIENT');
      await tx.query(
        delta > 0
          ? `UPDATE trust_fulfillment_inventory SET available_units=available_units+$1,on_hand_units=on_hand_units+$1,updated_at=now()
             WHERE location_id=$2 AND product_id=$3 AND offer_id IS NOT DISTINCT FROM $4`
          : `UPDATE trust_fulfillment_inventory SET available_units=available_units-$1,on_hand_units=GREATEST(0,on_hand_units-$1),updated_at=now()
             WHERE location_id=$2 AND product_id=$3 AND offer_id IS NOT DISTINCT FROM $4`,
        [amount, input.locationId, input.productId, input.offerId ?? null],
      );
    }
  }

  await ledger(tx, input.productId, delta, `inventory_transaction_${transactionType.toLowerCase()}`, input.orderId ?? input.reservationId ?? input.fulfillmentOrderId);
  await receipt(tx,{commandType:`inventory.${transactionType.toLowerCase()}`,aggregateType:'product',aggregateId:input.productId,idempotencyKey:input.idempotencyKey,requestHash:requestHash(input),result:{transactionId:claim.id,delta}});
  return { replay: false, transactionId: claim.id, delta };
}

export async function returnInventoryTransactionTx(tx: PoolClient, input: Common) {
  return adjustInventoryTransactionTx(tx, { ...input, delta: qty(input.quantity), transactionType: 'RETURN' });
}

export const V402_INVENTORY_TRANSACTION_ENGINE = true;
export const V403_INVENTORY_MUTATION_CLOSURE = true;
