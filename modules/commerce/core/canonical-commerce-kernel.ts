import type { PoolClient } from 'pg';
import { commitCheckout, type CheckoutInput, type CommittedOrder } from '../transactions/checkout';
import { commitGlobalCheckout, type GlobalCommitInput, type GlobalCommittedOrder } from '../transactions/global-checkout';
import { refreshCommerceExecutionGraphTx } from './execution-graph';

/**
 * V416 canonical commerce write boundary.
 *
 * The transaction implementations remain compatibility internals. Production
 * entrypoints must cross this boundary so that checkout surfaces share one
 * execution contract, observability, and future policy enforcement point.
 */
export const CANONICAL_COMMERCE_CONTRACT_VERSION = 'V416.0.0';
export type CanonicalCheckoutSurface = 'LOCAL_QUOTE' | 'GLOBAL_QUOTE';

export async function commitCanonicalCheckout(
  client: PoolClient,
  input: CheckoutInput,
  meta: { surface?: 'LOCAL_QUOTE'; quoteId?: string } = {},
): Promise<CommittedOrder> {
  assertCanonicalMetadata(meta.surface ?? 'LOCAL_QUOTE');
  const order = await commitCheckout(client, input);
  await recordCanonicalCommit(client, {
    surface: 'LOCAL_QUOTE',
    idempotencyKey: input.idempotencyKey,
    quoteId: meta.quoteId ?? null,
    orderId: order.id,
    customerId: order.customerId,
    status: order.status,
  });
  await refreshCommerceExecutionGraphTx(client, order.id);
  return order;
}

export async function commitCanonicalGlobalCheckout(
  client: PoolClient,
  input: GlobalCommitInput,
  meta: { surface?: 'GLOBAL_QUOTE' } = {},
): Promise<GlobalCommittedOrder> {
  assertCanonicalMetadata(meta.surface ?? 'GLOBAL_QUOTE');
  const order = await commitGlobalCheckout(client, input);
  await recordCanonicalCommit(client, {
    surface: 'GLOBAL_QUOTE',
    idempotencyKey: input.idempotencyKey,
    quoteId: input.quoteId,
    orderId: order.id,
    customerId: order.customerId,
    status: order.status,
  });
  await refreshCommerceExecutionGraphTx(client, order.id);
  return order;
}

async function recordCanonicalCommit(client: PoolClient, input: {
  surface: CanonicalCheckoutSurface;
  idempotencyKey: string;
  quoteId: string | null;
  orderId: string;
  customerId: string | null;
  status: string;
}) {
  await client.query(
    `insert into trust_commerce_execution_receipts
      (surface,idempotency_key,quote_id,order_id,customer_id,status,contract_version)
     values($1,$2,$3,$4,$5,'COMMITTED',$6)
     on conflict(surface,idempotency_key) do update
       set order_id=excluded.order_id,
           quote_id=coalesce(excluded.quote_id,trust_commerce_execution_receipts.quote_id),
           customer_id=excluded.customer_id,
           status='COMMITTED',
           contract_version=excluded.contract_version,
           updated_at=now()`,
    [input.surface, input.idempotencyKey, input.quoteId, input.orderId, input.customerId, CANONICAL_COMMERCE_CONTRACT_VERSION],
  );
}

function assertCanonicalMetadata(surface: CanonicalCheckoutSurface) {
  if (surface !== 'LOCAL_QUOTE' && surface !== 'GLOBAL_QUOTE') throw new Error('INVALID_COMMERCE_SURFACE');
}
