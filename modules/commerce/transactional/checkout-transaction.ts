import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureIdempotency, requestHash, saveIdempotency } from '../../platform/persistence/transaction-store';
import { reserveInventoryTransactionTx } from '../inventory/transaction-engine';

export type CheckoutLine = { productId: string; quantity: number };
export type TransactionalOrder = { id: string; customerId: string; total: number; currency: 'EGP' };

export async function createTransactionalOrder(
  db: SqlExecutor,
  input: { customerId: string; lines: CheckoutLine[]; idempotencyKey: string; shipping: number },
): Promise<TransactionalOrder> {
  if (!input.customerId || !input.idempotencyKey || input.lines.length === 0) throw new Error('INVALID_CHECKOUT');
  return db.transaction(async (tx) => {
    const expectedHash = requestHash('order.create', { customerId: input.customerId, lines: input.lines, shipping: input.shipping });
    const cached = await ensureIdempotency(tx, input.idempotencyKey, 'order.create', expectedHash);
    if (cached) return cached as TransactionalOrder;

    let subtotal = 0;
    const priced: Array<CheckoutLine & { unitPrice: number }> = [];
    for (const line of input.lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error('INVALID_QUANTITY');
      const result = await tx.query<{ id: string; price: string; stock: number; active: boolean }>(
        'select id, price, stock, active from trust_products where id = $1 for update', [line.productId],
      );
      const product = result.rows[0];
      if (!product || !product.active) throw new Error('PRODUCT_NOT_AVAILABLE');
      if (product.stock < line.quantity) throw new Error('INSUFFICIENT_STOCK');
      const unitPrice = Number(product.price);
      subtotal += unitPrice * line.quantity;
      priced.push({ ...line, unitPrice });
    }
    const total = subtotal + Math.max(0, input.shipping);
    const orderResult = await tx.query<{ id: string }>(
      `insert into trust_orders(customer_id,status,subtotal,discount,shipping,total,currency,idempotency_key)
       values($1,'pending',$2,0,$3,$4,'EGP',$5) returning id`,
      [input.customerId, subtotal, input.shipping, total, input.idempotencyKey],
    );
    const orderId = orderResult.rows[0].id;
    for (const line of priced) {
      const itemResult = await tx.query<{id:string}>(
        'insert into trust_order_items(order_id,product_id,quantity,unit_price) values($1,$2,$3,$4) returning id',
        [orderId, line.productId, line.quantity, line.unitPrice],
      );
      await reserveInventoryTransactionTx(tx as any, {
        productId: line.productId, orderId, quantity: line.quantity,
        idempotencyKey: `legacy-checkout:reserve:${orderId}:${itemResult.rows[0].id}`,
        source: 'LEGACY_CHECKOUT_COMPATIBILITY', metadata: { reservationStatus: 'reserved', orderItemId: itemResult.rows[0].id },
      });
      await tx.query(`insert into trust_inventory_reservations(order_id,product_id,quantity,status,expires_at,order_item_id) values($1,$2,$3,'reserved',now()+interval '30 minutes',$4) on conflict(order_item_id) do nothing`, [orderId,line.productId,line.quantity,itemResult.rows[0].id]);
    }
    const order: TransactionalOrder = { id: orderId, customerId: input.customerId, total, currency: 'EGP' };
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('order.created',$1,$2::jsonb)`, [orderId, JSON.stringify(order)]);
    await saveIdempotency(tx, input.idempotencyKey, 'order.create', order, 86400, expectedHash);
    return order;
  });
}
