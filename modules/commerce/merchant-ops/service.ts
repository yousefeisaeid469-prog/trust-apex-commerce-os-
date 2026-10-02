/** Canonical merchant operations: PostgreSQL only. No fixture or process-memory state. */
import { query, withPgTransaction } from '../../platform/db/postgres';
import type { Order } from '../core/service';
import type { Product } from '../core/types';
import { adjustInventoryTransactionTx } from '../inventory/transaction-engine';

export async function listMerchantOrders(merchantId: string): Promise<Order[]> {
  if (!merchantId?.trim()) throw new Error('MERCHANT_REQUIRED');
  const result = await query<any>(
    `select distinct o.id,o.customer_id,o.subtotal,o.shipping,o.total,o.status,o.created_at
       from trust_orders o
       join trust_order_items oi on oi.order_id=o.id
       join trust_products p on p.id=oi.product_id
      where p.merchant_id=$1
      order by o.created_at desc limit 500`, [merchantId]);
  const orders = result.rows.map((r: any) => ({
    id: String(r.id), customerId: r.customer_id ? String(r.customer_id) : 'guest',
    items: [] as {productId:string;qty:number}[], subtotal: Number(r.subtotal), shipping: Number(r.shipping), total: Number(r.total),
    status: String(r.status) as Order['status'], createdAt: new Date(r.created_at).toISOString(),
  }));
  if (!orders.length) return orders;
  const ids = orders.map(o => o.id);
  const items = await query<any>(`select order_id,product_id,quantity from trust_order_items where order_id = any($1::uuid[])`, [ids]);
  const byOrder = new Map<string,{productId:string;qty:number}[]>();
  for (const row of items.rows) {
    const list = byOrder.get(String(row.order_id)) ?? [];
    list.push({ productId:String(row.product_id), qty:Number(row.quantity) });
    byOrder.set(String(row.order_id), list);
  }
  return orders.map(o => ({ ...o, items: byOrder.get(o.id) ?? [] }));
}

export async function updateMerchantInventory(merchantId: string, productId: string, stock: number): Promise<Product> {
  if (!Number.isInteger(stock) || stock < 0 || stock > 10_000_000) throw new Error('INVALID_STOCK');
  return withPgTransaction(async client => {
    const before = await client.query<any>(`select stock from trust_products where id=$1 and merchant_id=$2 for update`, [productId, merchantId]);
    if (!before.rows[0]) throw new Error('PRODUCT_NOT_FOUND');
    const previousStock = Number(before.rows[0].stock);
    const delta = stock - previousStock;
    if (delta !== 0) await adjustInventoryTransactionTx(client, { productId, delta, idempotencyKey: `merchant-stock:${merchantId}:${productId}:${stock}`, source: 'MERCHANT_STOCK_ADJUSTMENT', metadata: { merchantId } });
    const result = await client.query<any>(
      `select id,merchant_id,name,category,price,old_price,stock,region,tags,image,rating from trust_products where id=$1 and merchant_id=$2`,
      [productId, merchantId]);
    const merchant = await client.query(`select store_name from trust_merchant_profiles where id=$1`, [merchantId]);
    const r = result.rows[0];
    return { id:String(r.id), name:String(r.name), category:String(r.category), price:Number(r.price), oldPrice:r.old_price==null?undefined:Number(r.old_price), merchantId:String(r.merchant_id), merchantName:String(merchant.rows[0]?.store_name??''), rating:Number(r.rating), stock:Number(r.stock), region:String(r.region), tags:Array.isArray(r.tags)?r.tags:[], image:String(r.image??'') };
  });
}

export async function bulkUpdateMerchantInventory(merchantId: string, updates: Array<{ productId: string; stock: number }>): Promise<Product[]> {
  if (!Array.isArray(updates) || updates.length < 1 || updates.length > 200) throw new Error('INVALID_BATCH');
  const seen = new Set<string>();
  for (const item of updates) {
    if (!item || typeof item.productId !== 'string' || seen.has(item.productId)) throw new Error('INVALID_PRODUCT_ID');
    seen.add(item.productId);
    if (!Number.isInteger(item.stock) || item.stock < 0 || item.stock > 10_000_000) throw new Error('INVALID_STOCK');
  }
  return withPgTransaction(async client => {
    const out: Product[] = [];
    const merchant = await client.query(`select store_name from trust_merchant_profiles where id=$1`, [merchantId]);
    const merchantName = String(merchant.rows[0]?.store_name ?? '');
    for (const item of updates) {
      const before = await client.query<any>(`select stock from trust_products where id=$1 and merchant_id=$2 for update`, [item.productId, merchantId]);
      if (!before.rows[0]) throw new Error('PRODUCT_NOT_FOUND');
      const previousStock = Number(before.rows[0].stock);
      const delta = item.stock - previousStock;
      if (delta !== 0) await adjustInventoryTransactionTx(client, { productId: item.productId, delta, idempotencyKey: `merchant-stock-bulk:${merchantId}:${item.productId}:${item.stock}`, source: 'MERCHANT_STOCK_BULK_ADJUSTMENT', metadata: { merchantId } });
      const result = await client.query<any>(
        `select id,merchant_id,name,category,price,old_price,stock,region,tags,image,rating from trust_products where id=$1 and merchant_id=$2`,
        [item.productId, merchantId]);
      const r=result.rows[0];
      out.push({id:String(r.id),name:String(r.name),category:String(r.category),price:Number(r.price),oldPrice:r.old_price==null?undefined:Number(r.old_price),merchantId:String(r.merchant_id),merchantName,rating:Number(r.rating),stock:Number(r.stock),region:String(r.region),tags:Array.isArray(r.tags)?r.tags:[],image:String(r.image??'')});
    }
    return out;
  });
}
