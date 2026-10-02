import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureIdempotency, requestHash, saveIdempotency } from '../../platform/persistence/transaction-store';
import { decideRecovery } from './policy';
import { dispositionDelta } from './state';
import { normalizedReason, positiveInt, requiredId, type RecoveryInput, type RecoveryDisposition } from './contracts';
import { returnInventoryTransactionTx, adjustInventoryTransactionTx } from '../inventory/transaction-engine';

export async function applyInventoryRecovery(db: SqlExecutor, input: RecoveryInput) {
  const returnId = requiredId(input.returnId, 'return_id');
  const itemId = input.returnItemId ? requiredId(input.returnItemId, 'return_item_id') : undefined;
  const productId = requiredId(input.productId, 'product_id');
  const actorId = requiredId(input.actorId, 'actor_id');
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  const quantity = positiveInt(input.quantity);
  if (!quantity) throw new Error('INVALID_RECOVERY_QUANTITY');
  if (!['RESTOCK','QUARANTINE','DISPOSE','RETURN_TO_VENDOR','REPLACE'].includes(input.disposition)) throw new Error('INVALID_RECOVERY_DISPOSITION');
  const reason = normalizedReason(input.reason);

  return db.transaction(async tx => {
    const hash = requestHash('inventory.recovery', { returnId, itemId, productId, disposition: input.disposition, quantity, warehouseLocation: input.warehouseLocation || null, reason });
    const cached = await ensureIdempotency(tx, key, 'inventory.recovery', hash);
    if (cached) return { ...(cached as object), replay: true };

    const ret = await tx.query<{ id: string; status: string; customer_id: string | null }>('select id,status,customer_id from trust_returns where id=$1 for update', [returnId]);
    if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
    if (!['RECEIVED','INSPECTING','APPROVED_REFUND','REFUND_PENDING','REFUNDED'].includes(ret.rows[0].status)) throw new Error('RETURN_NOT_RECOVERABLE');

    let returnItem = itemId ? (await tx.query<{ id: string; product_id: string; quantity: number; condition: any }>('select id,product_id,quantity,condition from trust_return_items where id=$1 and return_id=$2 for update', [itemId, returnId])).rows[0] : undefined;
    if (itemId && !returnItem) throw new Error('RETURN_ITEM_NOT_FOUND');
    if (returnItem && returnItem.product_id !== productId) throw new Error('RECOVERY_PRODUCT_MISMATCH');
    if (returnItem && quantity > Number(returnItem.quantity)) throw new Error('RECOVERY_QUANTITY_EXCEEDS_RETURN');

    const existing = await tx.query<{ quantity: string }>(`select coalesce(sum(quantity),0)::numeric quantity from trust_inventory_recovery_actions where return_id=$1 and product_id=$2 and status in ('PENDING','APPLIED')`, [returnId, productId]);
    if (returnItem && Number(existing.rows[0]?.quantity || 0) + quantity > Number(returnItem.quantity)) throw new Error('RECOVERY_QUANTITY_ALREADY_APPLIED');

    const product = await tx.query<{ id: string; stock: number; active: boolean }>('select id,stock,active from trust_products where id=$1 for update', [productId]);
    if (!product.rows[0]) throw new Error('PRODUCT_NOT_FOUND');

    const delta = dispositionDelta(input.disposition, quantity);
    if (delta < 0 && Number(product.rows[0].stock) + delta < 0) throw new Error('INVENTORY_UNDERFLOW');
    const action = await tx.query<{ id: string }>(`insert into trust_inventory_recovery_actions
      (return_id,return_item_id,product_id,disposition,quantity,delta,status,warehouse_location,reason,idempotency_key,applied_at)
      values($1,$2,$3,$4,$5,$6,'APPLIED',$7,$8,$9,now()) returning id`, [returnId, itemId || null, productId, input.disposition, quantity, delta, input.warehouseLocation || null, reason, key]);
    if (delta !== 0) {
      await adjustInventoryTransactionTx(tx as any, { productId, delta, returnId, idempotencyKey: `${key}:inventory`, source: `RETURN_RECOVERY_${input.disposition}`, metadata: { actionId: action.rows[0].id, disposition: input.disposition } });
    }
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`, ['inventory.recovery.applied', returnId, JSON.stringify({ actionId: action.rows[0].id, returnId, returnItemId: itemId || null, productId, disposition: input.disposition, quantity, delta, actorId })]);
    const result = { actionId: action.rows[0].id, returnId, productId, disposition: input.disposition, quantity, delta, status: 'APPLIED' as const };
    await saveIdempotency(tx, key, 'inventory.recovery', result, 86400, hash);
    return { ...result, replay: false };
  });
}

export async function reverseInventoryRecovery(db: SqlExecutor, input: { actionId: string; actorId: string; idempotencyKey: string }) {
  const actionId = requiredId(input.actionId, 'action_id');
  const actorId = requiredId(input.actorId, 'actor_id');
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  return db.transaction(async tx => {
    const hash = requestHash('inventory.recovery.reverse', { actionId });
    const cached = await ensureIdempotency(tx, key, 'inventory.recovery.reverse', hash);
    if (cached) return { ...(cached as object), replay: true };
    const action = await tx.query<any>('select * from trust_inventory_recovery_actions where id=$1 for update', [actionId]);
    const row = action.rows[0];
    if (!row) throw new Error('RECOVERY_ACTION_NOT_FOUND');
    if (row.status === 'REVERSED') return { actionId, status: 'REVERSED', replay: false };
    if (row.status !== 'APPLIED') throw new Error('RECOVERY_ACTION_NOT_REVERSIBLE');
    const product = await tx.query<{ stock: number }>('select stock from trust_products where id=$1 for update', [row.product_id]);
    if (!product.rows[0]) throw new Error('PRODUCT_NOT_FOUND');
    const reverseDelta = -Number(row.delta);
    if (Number(product.rows[0].stock) + reverseDelta < 0) throw new Error('RECOVERY_REVERSE_UNDERFLOW');
    if (reverseDelta !== 0) {
      await adjustInventoryTransactionTx(tx as any, { productId: String(row.product_id), delta: reverseDelta, returnId: String(row.return_id), idempotencyKey: `${key}:inventory`, source: 'RETURN_RECOVERY_REVERSE', metadata: { actionId } });
    }
    await tx.query(`update trust_inventory_recovery_actions set status='REVERSED',reversed_at=now(),updated_at=now() where id=$1`, [actionId]);
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('inventory.recovery.reversed',$1,$2::jsonb)`, [row.return_id, JSON.stringify({ actionId, actorId, reverseDelta })]);
    const result = { actionId, returnId: row.return_id, status: 'REVERSED' as const, reverseDelta };
    await saveIdempotency(tx, key, 'inventory.recovery.reverse', result, 86400, hash);
    return { ...result, replay: false };
  });
}

export async function recommendRecovery(db: SqlExecutor, input: { returnId: string; returnItemId: string; recoverable: boolean; restockable: boolean; condition: any; reason: any }) {
  const returnId = requiredId(input.returnId, 'return_id');
  const itemId = requiredId(input.returnItemId, 'return_item_id');
  const item = await db.query<any>(`select ri.id,ri.product_id,ri.quantity,ri.condition,r.reason_code,r.status from trust_return_items ri join trust_returns r on r.id=ri.return_id where ri.id=$1 and r.id=$2`, [itemId, returnId]);
  if (!item.rows[0]) throw new Error('RETURN_ITEM_NOT_FOUND');
  const row = item.rows[0];
  return { returnId, returnItemId: itemId, productId: row.product_id, quantity: Number(row.quantity), policy: decideRecovery({ reason: input.reason || row.reason_code, condition: input.condition || row.condition, recoverable: input.recoverable, restockable: input.restockable, quantity: Number(row.quantity) }) };
}

export async function listRecoveryActions(db: SqlExecutor, filters: { returnId?: string; productId?: string; status?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 250);
  const params: unknown[] = [];
  const where: string[] = ['1=1'];
  if (filters.returnId) { params.push(requiredId(filters.returnId, 'return_id')); where.push(`return_id=$${params.length}`); }
  if (filters.productId) { params.push(requiredId(filters.productId, 'product_id')); where.push(`product_id=$${params.length}`); }
  if (filters.status) { params.push(filters.status); where.push(`status=$${params.length}`); }
  params.push(limit);
  return (await db.query<any>(`select * from trust_inventory_recovery_actions where ${where.join(' and ')} order by created_at desc limit $${params.length}`, params)).rows;
}
