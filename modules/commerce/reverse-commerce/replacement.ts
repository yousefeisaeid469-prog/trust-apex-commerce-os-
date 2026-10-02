import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureIdempotency, requestHash, saveIdempotency } from '../../platform/persistence/transaction-store';
import { assertReplacementTransition } from './state';
import { positiveInt, positiveMoney, requiredId, type CreateReplacementInput, type ReplacementStatus } from './contracts';
import { postLedgerEntry } from './ledger';
import { adjustInventoryTransactionTx } from '../inventory/transaction-engine';

const replacementStatuses: readonly ReplacementStatus[] = ['REQUESTED','APPROVED','RESERVED','CONFIRMED','FULFILLING','SHIPPED','DELIVERED','CANCELLED','FAILED'];

function mapOrder(row: any) {
  return { id: row.id, returnId: row.return_id, originalOrderId: row.original_order_id, customerId: row.customer_id, status: row.status, currency: row.currency, merchandiseTotal: Number(row.merchandise_total), shippingTotal: Number(row.shipping_total), customerCharge: Number(row.customer_charge), createdAt: row.created_at, updatedAt: row.updated_at };
}

async function lockReplacement(tx: SqlExecutor, id: string) {
  const result = await tx.query<any>('select * from trust_replacement_orders where id=$1 for update', [id]);
  if (!result.rows[0]) throw new Error('REPLACEMENT_NOT_FOUND');
  return result.rows[0];
}

async function appendReplacementEvent(tx: SqlExecutor, input: { replacementOrderId: string; from: string | null; to: string; source: string; actorId?: string; note?: string }) {
  await tx.query(`insert into trust_replacement_events(replacement_order_id,from_status,to_status,source,actor_id,note) values($1,$2,$3,$4,$5,$6)`, [input.replacementOrderId, input.from, input.to, input.source, input.actorId || null, input.note || null]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('replacement.status_changed',$1,$2::jsonb)`, [input.replacementOrderId, JSON.stringify(input)]);
}

export async function createReplacement(db: SqlExecutor, input: CreateReplacementInput) {
  const returnId = requiredId(input.returnId, 'return_id');
  const customerId = requiredId(input.customerId, 'customer_id');
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('REPLACEMENT_ITEMS_REQUIRED');
  const shipping = input.shippingAmount === undefined ? 0 : (positiveMoney(input.shippingAmount) || 0);
  const seen = new Set<string>();
  for (const item of input.items) {
    const productId = requiredId(item.productId, 'product_id');
    const quantity = positiveInt(item.quantity);
    if (!quantity) throw new Error('INVALID_REPLACEMENT_QUANTITY');
    if (seen.has(productId)) throw new Error('DUPLICATE_REPLACEMENT_PRODUCT');
    seen.add(productId);
  }
  return db.transaction(async tx => {
    const hash = requestHash('replacement.create', { returnId, customerId, items: input.items, shipping });
    const cached = await ensureIdempotency(tx, key, 'replacement.create', hash);
    if (cached) return { ...(cached as object), replay: true };
    const ret = await tx.query<any>('select id,order_id,customer_id,status from trust_returns where id=$1 for update', [returnId]);
    if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
    if (ret.rows[0].customer_id !== customerId) throw new Error('RETURN_ACCESS_DENIED');
    if (!['APPROVED_REFUND','REFUND_PENDING','REFUNDED'].includes(ret.rows[0].status)) throw new Error('RETURN_NOT_ELIGIBLE_FOR_REPLACEMENT');
    const prior = await tx.query<any>(`select * from trust_replacement_orders where return_id=$1 and status not in ('CANCELLED','FAILED') order by created_at desc limit 1`, [returnId]);
    if (prior.rows[0]) throw new Error('REPLACEMENT_ALREADY_EXISTS');
    const prices: { productId: string; quantity: number; unitPrice: number }[] = [];
    let merchandise = 0;
    for (const item of input.items) {
      const product = await tx.query<any>('select id,price,stock,active from trust_products where id=$1 for update', [requiredId(item.productId, 'product_id')]);
      if (!product.rows[0] || !product.rows[0].active) throw new Error('REPLACEMENT_PRODUCT_UNAVAILABLE');
      if (Number(product.rows[0].stock) < Number(item.quantity)) throw new Error('REPLACEMENT_STOCK_UNAVAILABLE');
      const unitPrice = Number(product.rows[0].price);
      merchandise += unitPrice * Number(item.quantity);
      prices.push({ productId: product.rows[0].id, quantity: Number(item.quantity), unitPrice });
    }
    const inserted = await tx.query<{ id: string }>(`insert into trust_replacement_orders(return_id,original_order_id,customer_id,status,currency,merchandise_total,shipping_total,customer_charge,idempotency_key) values($1,$2,$3,'REQUESTED','EGP',$4,$5,0,$6) returning id`, [returnId, ret.rows[0].order_id, customerId, merchandise, shipping, key]);
    const replacementId = inserted.rows[0].id;
    for (const item of prices) await tx.query(`insert into trust_replacement_items(replacement_order_id,product_id,quantity,unit_price) values($1,$2,$3,$4)`, [replacementId, item.productId, item.quantity, item.unitPrice]);
    await appendReplacementEvent(tx, { replacementOrderId: replacementId, from: null, to: 'REQUESTED', source: 'customer', actorId: customerId });
    const result = { replacementOrderId: replacementId, status: 'REQUESTED' as const, merchandiseTotal: merchandise, shippingTotal: shipping, customerCharge: 0 };
    await saveIdempotency(tx, key, 'replacement.create', result, 86400, hash);
    return { ...result, replay: false };
  });
}

export async function transitionReplacement(db: SqlExecutor, input: { replacementOrderId: string; to: ReplacementStatus; actorId: string; source?: string; note?: string }) {
  const id = requiredId(input.replacementOrderId, 'replacement_order_id');
  const actorId = requiredId(input.actorId, 'actor_id');
  if (!replacementStatuses.includes(input.to)) throw new Error('INVALID_REPLACEMENT_STATUS');
  return db.transaction(async tx => {
    const row = await lockReplacement(tx, id);
    assertReplacementTransition(row.status, input.to);
    if (row.status === input.to) return { ...mapOrder(row), changed: false };
    if (input.to === 'RESERVED') {
      const items = await tx.query<any>('select * from trust_replacement_items where replacement_order_id=$1 for update', [id]);
      for (const item of items.rows) {
        const product = await tx.query<any>('select stock from trust_products where id=$1 for update', [item.product_id]);
        if (!product.rows[0] || Number(product.rows[0].stock) < Number(item.quantity)) throw new Error('REPLACEMENT_STOCK_UNAVAILABLE');
      }
      for (const item of items.rows) {
        await adjustInventoryTransactionTx(tx as any, { productId: String(item.product_id), delta: -Number(item.quantity), idempotencyKey: `replacement:${id}:reserve:${item.product_id}`, source: 'REPLACEMENT_RESERVE', orderId: String(id), metadata: { replacementId: String(id) } });
      }
    }
    await tx.query('update trust_replacement_orders set status=$2,updated_at=now() where id=$1', [id, input.to]);
    await appendReplacementEvent(tx, { replacementOrderId: id, from: row.status, to: input.to, source: input.source || 'operations', actorId, note: input.note });
    if (input.to === 'CONFIRMED' && Number(row.customer_charge) > 0) await postLedgerEntry(tx, { customerId: row.customer_id, replacementOrderId: id, entryType: 'REPLACEMENT_CHARGE', direction: 'DEBIT', amount: Number(row.customer_charge), referenceKey: `replacement-charge:${id}`, metadata: { actorId } });
    return { ...mapOrder(row), status: input.to, changed: true };
  });
}

export async function cancelReplacement(db: SqlExecutor, input: { replacementOrderId: string; actorId: string; reason: string; idempotencyKey: string }) {
  const id = requiredId(input.replacementOrderId, 'replacement_order_id');
  const actorId = requiredId(input.actorId, 'actor_id');
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  return db.transaction(async tx => {
    const hash = requestHash('replacement.cancel', { id, reason: input.reason });
    const cached = await ensureIdempotency(tx, key, 'replacement.cancel', hash);
    if (cached) return { ...(cached as object), replay: true };
    const row = await lockReplacement(tx, id);
    assertReplacementTransition(row.status, 'CANCELLED');
    if (['RESERVED','CONFIRMED','FULFILLING'].includes(row.status)) {
      const items = await tx.query<any>('select * from trust_replacement_items where replacement_order_id=$1', [id]);
      for (const item of items.rows) {
        await adjustInventoryTransactionTx(tx as any, { productId: String(item.product_id), delta: Number(item.quantity), idempotencyKey: `replacement:${id}:release:${item.product_id}`, source: 'REPLACEMENT_CANCEL_RELEASE', orderId: String(id), metadata: { replacementId: String(id) } });
      }
    }
    await tx.query(`update trust_replacement_orders set status='CANCELLED',updated_at=now() where id=$1`, [id]);
    await appendReplacementEvent(tx, { replacementOrderId: id, from: row.status, to: 'CANCELLED', source: 'operations', actorId, note: input.reason });
    const result = { replacementOrderId: id, status: 'CANCELLED' as const };
    await saveIdempotency(tx, key, 'replacement.cancel', result, 86400, hash);
    return { ...result, replay: false };
  });
}

export async function getReplacement(db: SqlExecutor, input: { replacementOrderId: string; customerId?: string; privileged?: boolean }) {
  const id = requiredId(input.replacementOrderId, 'replacement_order_id');
  const result = await db.query<any>('select * from trust_replacement_orders where id=$1 and ($2::boolean=true or customer_id=$3)', [id, Boolean(input.privileged), input.customerId || '']);
  if (!result.rows[0]) return null;
  const items = await db.query<any>('select * from trust_replacement_items where replacement_order_id=$1 order by created_at', [id]);
  const events = await db.query<any>('select * from trust_replacement_events where replacement_order_id=$1 order by created_at', [id]);
  return { ...mapOrder(result.rows[0]), items: items.rows, events: events.rows };
}

export async function listCustomerReplacements(db: SqlExecutor, customerId: string, limit = 50) {
  const id = requiredId(customerId, 'customer_id');
  const n = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const result = await db.query<any>('select * from trust_replacement_orders where customer_id=$1 order by created_at desc limit $2', [id, n]);
  return result.rows.map(mapOrder);
}

export async function listOperationsReplacements(db: SqlExecutor, status?: ReplacementStatus, limit = 100) {
  const n = Math.min(Math.max(Number(limit) || 100, 1), 250);
  const result = status ? await db.query<any>('select * from trust_replacement_orders where status=$1 order by updated_at asc limit $2', [status, n]) : await db.query<any>('select * from trust_replacement_orders order by updated_at asc limit $1', [n]);
  return result.rows.map(mapOrder);
}
