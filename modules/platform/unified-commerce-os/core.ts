import { query } from '../db/postgres.ts';

type Metric = { count:number; statuses:Record<string,number> };

async function statusMetric(table:string):Promise<Metric>{
  const r=await query<any>(`select count(*)::int as count, coalesce(jsonb_object_agg(status, n order by status),'{}'::jsonb) as statuses from (select status,count(*)::int n from ${table} group by status) s`,[]);
  return {count:Number(r.rows[0]?.count||0),statuses:r.rows[0]?.statuses||{}};
}

async function scalar(sql:string,params:any[]=[]){const r=await query<any>(sql,params);return r.rows[0]??{};}

function health(metrics:Record<string,Metric>, stale:{events:number;execution:number}, failures:any[]){
  if(stale.events||stale.execution) return {state:'DEGRADED',code:'STALE_WORK_PRESENT'};
  if(failures.some(x=>Number(x.count)>0)) return {state:'DEGRADED',code:'RECENT_COMMERCE_FAILURES'};
  return {state:'HEALTHY',code:null};
}

export async function getUnifiedCommerceOverview(){
  const [orders,payments,reservations,sellerOrders,fulfillments,shipments,events,deliveries,execution,revenue]=await Promise.all([
    statusMetric('trust_orders'),statusMetric('trust_payments'),statusMetric('trust_inventory_reservations'),statusMetric('trust_seller_orders'),
    statusMetric('trust_marketplace_fulfillment_orders'),statusMetric('trust_shipments'),statusMetric('trust_commerce_events'),statusMetric('trust_event_deliveries'),
    statusMetric('trust_commerce_execution_jobs'),statusMetric('trust_revenue_ledger')
  ]);
  const [staleEvents,staleExecution,revenueTotal,orderValue,recentFailures,recovery]=await Promise.all([
    scalar(`select count(*)::int as count from trust_event_deliveries where status='PROCESSING' and locked_at < now()-interval '2 minutes'`),
    scalar(`select count(*)::int as count from trust_commerce_execution_jobs where status='PROCESSING' and lease_until < now()`),
    scalar(`select coalesce(sum(case when kind in ('SALE','COMMISSION','FEE','ADVERTISING','SUBSCRIPTION') then amount else 0 end),0) as amount, count(*)::int as entries from trust_revenue_ledger`),
    scalar(`select coalesce(sum(total),0) as amount, count(*)::int as orders from trust_orders where created_at >= now()-interval '24 hours'`),
    query<any>(`select status,count(*)::int as count from trust_payments where status in ('failed','FAILED','CANCELED','CANCELLED') and updated_at >= now()-interval '24 hours' group by status order by count desc`,[]),
    scalar(`select count(*)::int as count from trust_commerce_reliability_recovery_runs where created_at >= now()-interval '24 hours' and verified=true`)
  ]);
  const metrics={orders,payments,reservations,sellerOrders,fulfillments,shipments,events,deliveries,execution,revenue};
  const failures=recentFailures.rows;
  return {
    version:'V374.0.0', capturedAt:new Date().toISOString(),
    health:health(metrics,{events:Number(staleEvents.count||0),execution:Number(staleExecution.count||0)},failures),
    commerce:{
      ordersLast24h:Number(orderValue.orders||0),orderValueLast24h:String(orderValue.amount||0),
      revenueLedgerEntries:revenue.entries||0,revenueLedgerAmount:String(revenueTotal.amount||0),
      verifiedRecoveriesLast24h:Number(recovery.count||0)
    },
    staleWork:{consumerDeliveries:Number(staleEvents.count||0),executionJobs:Number(staleExecution.count||0)},
    domains:metrics,
    recentPaymentFailures:failures,
    architecture:{sourceOfTruth:'existing commerce authorities',readModel:'unified operational projection',recoveryAuthority:'V373 order-scoped recovery',mutationBoundary:'business authorities remain authoritative'}
  };
}
