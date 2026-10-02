import type { PoolClient } from 'pg';

export const COMMERCE_EXECUTION_GRAPH_VERSION = 'V417.0.0';

type GraphNode = { status: string; referenceId: string | null; count?: number; metadata?: Record<string, unknown> };
type GraphGap = { code: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; message: string; node: string };

export async function refreshCommerceExecutionGraphTx(tx: PoolClient, orderId: string) {
  const order = (await tx.query<any>(`select id,customer_id,status,payment_method,total,currency from trust_orders where id=$1 for update`, [orderId])).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');

  const [receipt, payment, execution, fulfillment, shipment, settlement, runtime, inventory] = await Promise.all([
    tx.query<any>(`select id,surface,idempotency_key,quote_id,contract_version,status from trust_commerce_execution_receipts where order_id=$1 order by created_at desc limit 1`, [orderId]),
    tx.query<any>(`select id,status,amount,currency,payment_intent_id from trust_payments where order_id=$1 order by created_at desc,id desc limit 1`, [orderId]),
    tx.query<any>(`select id,status,fulfillment_order_count,delivered_fulfillment_order_count,settlement_id from trust_commerce_execution_runs where order_id=$1 order by created_at desc,id desc limit 1`, [orderId]),
    tx.query<any>(`select count(*)::int count, count(*) filter(where status='DELIVERED')::int delivered, count(*) filter(where status='EXCEPTION')::int exceptions from trust_marketplace_fulfillment_orders where order_id=$1`, [orderId]),
    tx.query<any>(`select count(*)::int count, count(*) filter(where status='DELIVERED')::int delivered, count(*) filter(where status='EXCEPTION')::int exceptions from trust_shipments where order_id=$1`, [orderId]),
    tx.query<any>(`select id,status,gross_amount,seller_net,currency from trust_marketplace_payment_settlements where order_id=$1 order by created_at desc limit 1`, [orderId]),
    tx.query<any>(`select id,status,last_error_code,attempt_count from trust_runtime_operations where operation_type='commerce.order' and operation_key=$1 order by created_at desc limit 1`, [String(orderId)]),
    tx.query<any>(`select count(*)::int count, count(*) filter(where type='RESERVE')::int reserved, count(*) filter(where type='RELEASE')::int released, count(*) filter(where type='SHIP')::int shipped from trust_inventory_transactions where order_id=$1`, [orderId]),
  ]);

  const r = receipt.rows[0] ?? null;
  const p = payment.rows[0] ?? null;
  const e = execution.rows[0] ?? null;
  const f = fulfillment.rows[0] ?? { count: 0, delivered: 0, exceptions: 0 };
  const s = shipment.rows[0] ?? { count: 0, delivered: 0, exceptions: 0 };
  const st = settlement.rows[0] ?? null;
  const rt = runtime.rows[0] ?? null;
  const inv = inventory.rows[0] ?? { count: 0, reserved: 0, released: 0, shipped: 0 };

  const nodes: Record<string, GraphNode> = {
    CHECKOUT: { status: r ? 'COMMITTED' : 'MISSING', referenceId: r?.id ?? null, metadata: { surface: r?.surface ?? null, quoteId: r?.quote_id ?? null, contractVersion: r?.contract_version ?? null } },
    ORDER: { status: String(order.status), referenceId: String(order.id), metadata: { paymentMethod: order.payment_method, total: Number(order.total), currency: order.currency } },
    PAYMENT: { status: p ? String(p.status).toUpperCase() : 'NOT_STARTED', referenceId: p?.id ?? null, metadata: { amount: p ? Number(p.amount) : null, currency: p?.currency ?? null } },
    INVENTORY: { status: Number(inv.reserved) > 0 || Number(inv.shipped) > 0 ? 'EXECUTED' : 'NOT_OBSERVED', referenceId: null, count: Number(inv.count), metadata: { reserved: Number(inv.reserved), released: Number(inv.released), shipped: Number(inv.shipped) } },
    EXECUTION: { status: e?.status ? String(e.status) : 'NOT_STARTED', referenceId: e?.id ?? null, metadata: { fulfillmentOrderCount: Number(e?.fulfillment_order_count ?? 0), deliveredFulfillmentOrderCount: Number(e?.delivered_fulfillment_order_count ?? 0), settlementId: e?.settlement_id ?? null } },
    FULFILLMENT: { status: Number(f.count) === 0 ? 'NOT_STARTED' : Number(f.exceptions) > 0 ? 'EXCEPTION' : Number(f.delivered) === Number(f.count) ? 'DELIVERED' : 'IN_PROGRESS', referenceId: null, count: Number(f.count), metadata: { delivered: Number(f.delivered), exceptions: Number(f.exceptions) } },
    DELIVERY: { status: Number(s.count) === 0 ? 'NOT_STARTED' : Number(s.exceptions) > 0 ? 'EXCEPTION' : Number(s.delivered) === Number(s.count) ? 'DELIVERED' : 'IN_PROGRESS', referenceId: null, count: Number(s.count), metadata: { delivered: Number(s.delivered), exceptions: Number(s.exceptions) } },
    SETTLEMENT: { status: st ? String(st.status) : 'NOT_STARTED', referenceId: st?.id ?? null, metadata: { grossAmount: st ? Number(st.gross_amount) : null, sellerNet: st ? Number(st.seller_net) : null, currency: st?.currency ?? null } },
    RUNTIME: { status: rt ? String(rt.status) : 'MISSING', referenceId: rt?.id ?? null, metadata: { attempts: Number(rt?.attempt_count ?? 0), errorCode: rt?.last_error_code ?? null } },
  };

  const gaps: GraphGap[] = [];
  if (!r) gaps.push({ code: 'CANONICAL_RECEIPT_MISSING', severity: 'CRITICAL', message: 'Order exists without a V416 canonical checkout receipt.', node: 'CHECKOUT' });
  if (String(order.payment_method) !== 'cod' && !p) gaps.push({ code: 'PAYMENT_MISSING', severity: 'CRITICAL', message: 'Non-COD order has no payment record.', node: 'PAYMENT' });
  if (p?.status === 'captured' && !e) gaps.push({ code: 'CAPTURED_PAYMENT_NO_EXECUTION', severity: 'CRITICAL', message: 'Captured payment has no commerce execution run.', node: 'EXECUTION' });
  if (e && Number(e.fulfillment_order_count ?? 0) > 0 && Number(f.count) === 0) gaps.push({ code: 'EXECUTION_NO_FULFILLMENT', severity: 'CRITICAL', message: 'Execution expects fulfillment orders but none exist.', node: 'FULFILLMENT' });
  if (Number(f.count) > 0 && Number(inv.count) === 0 && p?.status === 'captured') gaps.push({ code: 'FULFILLMENT_NO_INVENTORY_LEDGER', severity: 'WARNING', message: 'Fulfillment exists but no inventory transaction was observed for the order.', node: 'INVENTORY' });
  if (e?.status === 'DELIVERED' && !st) gaps.push({ code: 'DELIVERED_WITHOUT_SETTLEMENT', severity: 'CRITICAL', message: 'Execution is delivered without a settlement record.', node: 'SETTLEMENT' });
  if (String(order.status) === 'delivered' && Number(s.delivered) === Number(s.count) && Number(s.count) > 0 && !st) gaps.push({ code: 'ORDER_DELIVERED_NO_SETTLEMENT', severity: 'CRITICAL', message: 'Delivered order has no settlement.', node: 'SETTLEMENT' });
  if (e?.status === 'COMPLETED' && !st) gaps.push({ code: 'COMPLETED_WITHOUT_SETTLEMENT', severity: 'CRITICAL', message: 'Completed execution has no settlement record.', node: 'SETTLEMENT' });
  if (st && Number(s.delivered) < Number(s.count) && Number(s.count) > 0) gaps.push({ code: 'SETTLEMENT_BEFORE_DELIVERY', severity: 'CRITICAL', message: 'Settlement exists before all shipments are delivered.', node: 'SETTLEMENT' });
  if (!rt && ['captured','processing','shipped','delivered'].includes(String(order.status))) gaps.push({ code: 'RUNTIME_OPERATION_MISSING', severity: 'WARNING', message: 'Active order has no commerce.order runtime operation.', node: 'RUNTIME' });

  const edges = [
    ['CHECKOUT','ORDER'], ['ORDER','PAYMENT'], ['PAYMENT','INVENTORY'], ['INVENTORY','EXECUTION'],
    ['EXECUTION','FULFILLMENT'], ['FULFILLMENT','DELIVERY'], ['DELIVERY','SETTLEMENT'], ['SETTLEMENT','ORDER'], ['ORDER','RUNTIME'],
  ];
  const terminal = String(order.status) === 'refunded' || String(e?.status) === 'REFUNDED' ? 'REFUNDED' : String(e?.status) === 'COMPLETED' ? 'COMPLETED' : gaps.some(g => g.severity === 'CRITICAL') ? 'BLOCKED' : ['pending','confirmed','processing'].includes(String(order.status)) ? 'WAITING' : gaps.length ? 'INCOMPLETE' : 'HEALTHY';

  const saved = await tx.query<any>(
    `insert into trust_commerce_execution_graphs(order_id,graph_version,graph_state,nodes_json,edges_json,gaps_json,gap_count,last_evaluated_at,updated_at)
     values($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,now(),now())
     on conflict(order_id) do update set graph_version=excluded.graph_version,graph_state=excluded.graph_state,nodes_json=excluded.nodes_json,edges_json=excluded.edges_json,gaps_json=excluded.gaps_json,gap_count=excluded.gap_count,last_evaluated_at=now(),updated_at=now()
     returning id,order_id,graph_version,graph_state,nodes_json,edges_json,gaps_json,gap_count,last_evaluated_at,updated_at`,
    [orderId, COMMERCE_EXECUTION_GRAPH_VERSION, terminal, JSON.stringify(nodes), JSON.stringify(edges), JSON.stringify(gaps), gaps.length],
  );
  return saved.rows[0];
}

export async function getCommerceExecutionGraphTx(tx: PoolClient, orderId: string) {
  const row = (await tx.query(`select * from trust_commerce_execution_graphs where order_id=$1`, [orderId])).rows[0];
  return row ?? null;
}
