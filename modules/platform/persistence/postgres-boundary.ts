/**
 * Production database boundary. Keep the domain layer independent of the SQL client.
 * A concrete adapter should use parameterized queries, transactions and row-level
 * locking for stock reservation. Do not expose DATABASE_URL to client bundles.
 */
export type SqlExecutor = {
  query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<{ rows: T[] }>;
  transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T>;
};

export async function reserveInventoryTransaction(
  db: SqlExecutor,
  productId: string,
  quantity: number,
) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Invalid quantity');
  const { reserveInventoryTransactionTx } = await import('../../commerce/inventory/transaction-engine');
  return db.transaction(async (tx) => {
    const result = await reserveInventoryTransactionTx(tx as any, {
      productId, quantity, idempotencyKey: `boundary:reserve:${productId}:${quantity}`, source: 'PLATFORM_POSTGRES_BOUNDARY',
    });
    const row = await tx.query<{ stock:number }>('select stock from trust_products where id=$1',[productId]);
    return { productId, remainingStock: Number(row.rows[0]?.stock ?? 0), transactionId: result.transactionId };
  });
}
