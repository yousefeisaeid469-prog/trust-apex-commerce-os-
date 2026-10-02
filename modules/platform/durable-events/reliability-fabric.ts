import { query, withPgTransaction } from '../db/postgres.ts';

type Node = { key:string; domain:string; entityType:string; entityId:string; status:string; occurredAt:string|null; sourceTable:string; metadata:Record<string,unknown> };
type Edge = { from:string; to:string; relation:string };

function node(key:string,domain:string,entityType:string,entityId:string,status:string,sourceTable:string,occurredAt:any,metadata:Record<string,unknown>={}):Node{
  return {key,domain,entityType,entityId,status:String(status??'UNKNOWN'),sourceTable,occurredAt:occurredAt?new Date(occurredAt).toISOString():null,metadata};
}

function rootCause(nodes:Node[]):{state:'HEALTHY'|'DEGRADED'|'BLOCKED'|'UNKNOWN';code:string|null;impact:Record<string,unknown>} {
  const bad = nodes.filter(n => ['FAILED','DEAD','EXCEPTION','CANCELLED','PROCESSING_STALE','RETRYING'].includes(n.status));
  const blocked = nodes.filter(n => ['PENDING','WAITING','PROCESSING'].includes(n.status));
  const executionDead = nodes.some(n => n.domain==='EXECUTION' && n.status==='DEAD');
  const paymentFailed = nodes.some(n => n.domain==='PAYMENT' && n.status==='failed');
  const deliveryException = nodes.some(n => n.domain==='DELIVERY' && n.status==='EXCEPTION');
  const inventoryBlocked = nodes.some(n => n.domain==='INVENTORY' && ['reserved','expired'].includes(n.status));
  if(paymentFailed) return {state:'BLOCKED',code:'PAYMENT_FAILED',impact:{blockedDomains:['PAYMENT','INVENTORY','FULFILLMENT','DELIVERY','SETTLEMENT','REVENUE']}};
  if(executionDead) return {state:'BLOCKED',code:'EXECUTION_DEAD_LETTER',impact:{blockedDomains:['EXECUTION','FULFILLMENT','DELIVERY','SETTLEMENT']}};
  if(deliveryException) return {state:'DEGRADED',code:'DELIVERY_EXCEPTION',impact:{blockedDomains:['DELIVERY','SETTLEMENT']}};
  if(inventoryBlocked) return {state:'DEGRADED',code:'INVENTORY_RESERVATION_ACTIVE',impact:{blockedDomains:['INVENTORY','FULFILLMENT']}};
  if(bad.length) return {state:'DEGRADED',code:`${bad[0].domain}_ERROR`,impact:{affectedNodes:bad.length}};
  if(blocked.length) return {state:'DEGRADED',code:`${blocked[0].domain}_IN_PROGRESS`,impact:{pendingNodes:blocked.length}};
  if(nodes.length<=1) return {state:'UNKNOWN',code:'INSUFFICIENT_COMMERCE_EVIDENCE',impact:{nodeCount:nodes.length}};
  return {state:'HEALTHY',code:null,impact:{nodeCount:nodes.length}};
}

export async function materializeCommerceReliabilityTrace(orderId:string){
  if(!orderId) throw new Error('ORDER_ID_REQUIRED');
  const data = await Promise.all([
    query<any>(`select id,status,subtotal,shipping,total,currency,created_at,updated_at from trust_orders where id=$1`,[orderId]),
    query<any>(`select id,provider,payment_intent_id,status,amount,currency,created_at,updated_at from trust_payments where order_id=$1 order by created_at`,[orderId]),
    query<any>(`select id,status,quantity,order_item_id,expires_at,created_at,updated_at from trust_inventory_reservations where order_id=$1 order by created_at`,[orderId]),
    query<any>(`select id,status,merchant_id,total,currency,created_at,updated_at from trust_seller_orders where order_id=$1 order by created_at`,[orderId]),
    query<any>(`select id,order_id,merchant_id,status,planned_at,packed_at,handed_off_at,delivered_at,updated_at from trust_marketplace_fulfillment_orders where order_id=$1 order by planned_at`,[orderId]),
    query<any>(`select id,status,carrier,tracking_number,created_at,updated_at,eta_at from trust_shipments where order_id=$1 order by created_at`,[orderId]),
    query<any>(`select id,order_item_id,reservation_id,seller_order_id,fulfillment_order_id,status,quantity,allocated_at,updated_at from trust_fulfillment_allocations where order_item_id in (select id from trust_order_items where order_id=$1) order by allocated_at`,[orderId]),
    query<any>(`select id,job_type,status,attempts,failure_count,last_error_code,lease_until,created_at,updated_at from trust_commerce_execution_jobs where order_id=$1 order by created_at`,[orderId]),
    query<any>(`select id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,created_at from trust_revenue_ledger where order_id=$1 order by created_at`,[orderId]),
    query<any>(`select event_id,event_type,aggregate_id,sequence_no,occurred_at,correlation_id,causation_id,idempotency_key,payload from trust_commerce_events where tenant_id is not null and (aggregate_id=$1::text or payload->>'orderId'=$1::text) order by occurred_at`,[orderId]),
  ]);
  const [orders,payments,reservations,sellerOrders,fulfillments,shipments,allocations,executions,revenue,events] = data.map(x=>x.rows);
  const o=orders[0]; if(!o) throw new Error('ORDER_NOT_FOUND');
  const nodes:Node[]=[]; const edges:Edge[]=[];
  nodes.push(node(`order:${o.id}`,'ORDER','ORDER',o.id,o.status,'trust_orders',o.created_at,{total:o.total,currency:o.currency}));
  for(const e of events) nodes.push(node(`event:${e.event_id}`,'EVENT','COMMERCE_EVENT',e.event_id,e.event_type,'trust_commerce_events',e.occurred_at,{aggregateId:e.aggregate_id,sequenceNo:e.sequence_no,correlationId:e.correlation_id,causationId:e.causation_id}));
  for(const p of payments){ const k=`payment:${p.id}`; nodes.push(node(k,'PAYMENT','PAYMENT',p.id,p.status,'trust_payments',p.created_at,{provider:p.provider,amount:p.amount,currency:p.currency,paymentIntentId:p.payment_intent_id})); edges.push({from:`order:${o.id}`,to:k,relation:'CAUSES'}); }
  for(const r of reservations){ const k=`inventory:${r.id}`; nodes.push(node(k,'INVENTORY','RESERVATION',r.id,r.status,'trust_inventory_reservations',r.created_at,{quantity:r.quantity,orderItemId:r.order_item_id,expiresAt:r.expires_at})); edges.push({from:`order:${o.id}`,to:k,relation:'DEPENDS_ON'}); }
  for(const s of sellerOrders){ const k=`seller-order:${s.id}`; nodes.push(node(k,'SETTLEMENT','SELLER_ORDER',s.id,s.status,'trust_seller_orders',s.created_at,{merchantId:s.merchant_id,total:s.total,currency:s.currency})); edges.push({from:`order:${o.id}`,to:k,relation:'SETTLES'}); }
  for(const f of fulfillments){ const k=`fulfillment:${f.id}`; nodes.push(node(k,'FULFILLMENT','FULFILLMENT_ORDER',f.id,f.status,'trust_marketplace_fulfillment_orders',f.planned_at,{merchantId:f.merchant_id})); edges.push({from:`order:${o.id}`,to:k,relation:'FULFILLS'}); }
  for(const a of allocations){ const k=`allocation:${a.id}`; nodes.push(node(k,'FULFILLMENT','ALLOCATION',a.id,a.status,'trust_fulfillment_allocations',a.allocated_at,{reservationId:a.reservation_id,fulfillmentOrderId:a.fulfillment_order_id,sellerOrderId:a.seller_order_id,quantity:a.quantity})); edges.push({from:`inventory:${a.reservation_id}`,to:k,relation:'FULFILLS'}); edges.push({from:`fulfillment:${a.fulfillment_order_id}`,to:k,relation:'EXECUTES'}); if(a.seller_order_id) edges.push({from:`seller-order:${a.seller_order_id}`,to:k,relation:'FULFILLS'}); }
  for(const s of shipments){ const k=`shipment:${s.id}`; nodes.push(node(k,'DELIVERY','SHIPMENT',s.id,s.status,'trust_shipments',s.created_at,{carrier:s.carrier,trackingNumber:s.tracking_number,etaAt:s.eta_at})); edges.push({from:`order:${o.id}`,to:k,relation:'DELIVERS'}); }
  for(const x of executions){ const k=`execution:${x.id}`; const stale=x.status==='PROCESSING'&&x.lease_until&&new Date(x.lease_until).getTime()<Date.now(); nodes.push(node(k,'EXECUTION','EXECUTION_JOB',x.id,stale?'PROCESSING_STALE':x.status,'trust_commerce_execution_jobs',x.created_at,{jobType:x.job_type,attempts:x.attempts,failureCount:x.failure_count,lastErrorCode:x.last_error_code,leaseUntil:x.lease_until})); edges.push({from:`order:${o.id}`,to:k,relation:'EXECUTES'}); }
  for(const r of revenue){ const k=`revenue:${r.id}`; nodes.push(node(k,'REVENUE','REVENUE_LEDGER',r.id,r.kind,'trust_revenue_ledger',r.created_at,{surface:r.surface,amount:r.amount,currency:r.currency,referenceType:r.reference_type,referenceId:r.reference_id})); edges.push({from:`order:${o.id}`,to:k,relation:'GENERATES'}); }
  for(const e of events) edges.push({from:`order:${o.id}`,to:`event:${e.event_id}`,relation:'OBSERVED_BY'});

  const diagnosis=rootCause(nodes);
  const sourceCorrelations=[...new Set(events.map(e=>e.correlation_id).filter(Boolean))];
  const trace = await withPgTransaction(async client=>{
    const t=await client.query<any>(`insert into trust_commerce_reliability_traces(order_id,correlation_id,state,root_cause_code,impact,source_correlations,observed_at,updated_at) values($1,$2,$3,$4,$5::jsonb,$6::jsonb,now(),now()) on conflict(order_id) do update set correlation_id=excluded.correlation_id,state=excluded.state,root_cause_code=excluded.root_cause_code,impact=excluded.impact,source_correlations=excluded.source_correlations,observed_at=excluded.observed_at,updated_at=now() returning id,order_id,correlation_id,state,root_cause_code,impact,source_correlations,observed_at`,[orderId,`commerce:order:${orderId}`,diagnosis.state,diagnosis.code,JSON.stringify(diagnosis.impact),JSON.stringify(sourceCorrelations)]);
    const traceId=t.rows[0].id;
    await client.query(`delete from trust_commerce_reliability_trace_edges where trace_id=$1`,[traceId]);
    await client.query(`delete from trust_commerce_reliability_trace_nodes where trace_id=$1`,[traceId]);
    for(const n of nodes) await client.query(`insert into trust_commerce_reliability_trace_nodes(trace_id,node_key,domain,entity_type,entity_id,status,occurred_at,source_table,metadata) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,[traceId,n.key,n.domain,n.entityType,n.entityId,n.status,n.occurredAt,n.sourceTable,JSON.stringify(n.metadata)]);
    for(const e of edges) await client.query(`insert into trust_commerce_reliability_trace_edges(trace_id,from_node_key,to_node_key,relation) values($1,$2,$3,$4) on conflict do nothing`,[traceId,e.from,e.to,e.relation]);
    return t.rows[0];
  });
  return {trace,nodes,edges,diagnosis};
}

export async function getCommerceReliabilityTrace(orderId:string){
  const t=await query<any>(`select id,order_id,correlation_id,state,root_cause_code,impact,source_correlations,observed_at,updated_at from trust_commerce_reliability_traces where order_id=$1`,[orderId]);
  if(!t.rows[0]) return materializeCommerceReliabilityTrace(orderId);
  const trace=t.rows[0];
  const [nodes,edges]=await Promise.all([
    query<any>(`select node_key,domain,entity_type,entity_id,status,occurred_at,source_table,metadata from trust_commerce_reliability_trace_nodes where trace_id=$1 order by occurred_at nulls last,created_at`,[trace.id]),
    query<any>(`select from_node_key,to_node_key,relation from trust_commerce_reliability_trace_edges where trace_id=$1 order by id`,[trace.id]),
  ]);
  return {trace,nodes:nodes.rows.map(n=>({key:n.node_key,domain:n.domain,entityType:n.entity_type,entityId:n.entity_id,status:n.status,occurredAt:n.occurred_at,sourceTable:n.source_table,metadata:n.metadata})),edges:edges.rows.map(e=>({from:e.from_node_key,to:e.to_node_key,relation:e.relation})),diagnosis:{state:trace.state,code:trace.root_cause_code,impact:trace.impact}};
}
