import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { runEffect, idempotencyEffect } from './runtime.ts';
import { buildGrowthNetwork } from '../../platform/growth-network/core.ts';
import { buildGlobalCommerceGraph } from '../../platform/global-commerce-graph/core.ts';
import { buildRevenueAutopilotPlan } from '../../platform/revenue-autopilot/index.ts';
import { estimateRevenueEconomics, buildRevenueScenarios } from '../../platform/revenue-intelligence/index.ts';
import { buildGrowthPlan } from '../../platform/commerce-growth-os/core.ts';
import { buildCommerceAiCopilot } from '../../platform/commerce-ai-copilot/core.ts';
import { deriveCommerceBrain } from '../../platform/commerce-brain/core.ts';

const SUPPORTED = new Set(['ORDER_PLACED','PAYMENT_CONFIRMED','DELIVERED','RETURN_REQUESTED']);

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!SUPPORTED.has(event.eventType)) return { status: 'PROCESSED', effectKey: idempotencyEffect(event, 'commerce-intelligence-skip') };
  return runEffect(event, 'commerce-intelligence', idempotencyEffect(event, 'commerce-intelligence'), async tx => {
    const ordersResult = await tx.query<any>(`
      select o.id,o.customer_id,o.status,o.total,o.created_at,
             coalesce(json_agg(json_build_object('productId',oi.product_id,'qty',oi.quantity)) filter (where oi.id is not null),'[]'::json) items
        from trust_orders o
        left join trust_order_items oi on oi.order_id=o.id
       where o.created_at >= now() - interval '180 days'
       group by o.id
       order by o.created_at desc
       limit 500`);
    const productsResult = await tx.query<any>(`select id,name,price,stock from trust_products where active=true order by updated_at desc limit 1000`);
    const problemsResult = await tx.query<any>(`
      select coalesce(customer_id,'') customer_id, product_id, id
        from trust_problem_cases
       where created_at >= now() - interval '180 days'
       limit 1000`).catch(() => ({ rows: [] }));

    const orders = ordersResult.rows.map((o:any) => ({
      id: String(o.id), customerId: o.customer_id ? String(o.customer_id) : 'guest',
      status: String(o.status), total: Number(o.total), items: Array.isArray(o.items) ? o.items : [],
    }));
    const products = productsResult.rows.map((p:any) => ({ id:String(p.id), name:String(p.name ?? ''), price:Number(p.price), stock:Number(p.stock) }));
    const problems = problemsResult.rows.map((p:any) => ({ id:String(p.id), customerId:String(p.customer_id), productId:String(p.product_id) }));

    const brainEvents = [{
      eventId:event.eventId, type:event.eventType, tenantId:event.tenantId, aggregateId:event.aggregateId,
      version:Number(event.schemaVersion ?? 1), payload:event.payload ?? {}, idempotencyKey:event.idempotencyKey,
      occurredAt:event.occurredAt,
    }];
    const brain = deriveCommerceBrain(brainEvents, new Date().toISOString());
    const growth = buildGrowthNetwork({ products, orders });
    const graph = buildGlobalCommerceGraph({ products, orders, problems });
    const delivered = orders.filter((o:any) => o.status === 'delivered');
    const revenueMinor = Math.round(delivered.reduce((s:number,o:any)=>s+o.total,0) * 100);
    const eligibleUnits = Math.max(1, delivered.length);
    const avgChargeMinor = BigInt(Math.max(0, Math.round((delivered.length ? revenueMinor / delivered.length : 0))));
    const revenueEconomics = estimateRevenueEconomics({
      eligibleUnits, averageChargeMinor:avgChargeMinor, variableCostBps:0,
      demandScore:Math.min(100, growth.repeatRate), conversionScore:Math.min(100, delivered.length),
      retentionScore:Math.min(100, growth.repeatRate), operationalScore:100,
      riskScore:brain.health.unknownCount > 0 ? 100 : 0, evidenceCoverage:100,
    });
    const scenarios = buildRevenueScenarios({
      steps:3, baseRateBps:10000, averageBaseMinor:avgChargeMinor,
      eligibleUnits, variableCostBps:0,
    });
    const revenuePlan = buildRevenueAutopilotPlan({
      trafficIntent:delivered.length, repeatRate:growth.repeatRate,
      sellerCount:0, b2bDemand:0, crossBorderDemand:0, fulfillmentDemand:0,
      brandDemand:0, mediaDemand:0,
    });
    const growthPlan = buildGrowthPlan({
      inventoryRisk:products.filter((p:any)=>p.stock<=0).length,
      adDemand:0, repeatRate:growth.repeatRate, b2bDemand:0, crossBorderDemand:0,
    });
    const copilot = buildCommerceAiCopilot({ message:'order intelligence', products:products.slice(0,10) });

    await tx.query(`
      insert into trust_commerce_intelligence_snapshots
        (tenant_id,event_id,aggregate_id,event_type,brain,growth_network,global_graph,revenue_plan,revenue_economics,revenue_scenarios,growth_plan,copilot,event_summary)
      values($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb)
      on conflict(tenant_id,event_id) do update set updated_at=now()`,
      [event.tenantId,event.eventId,event.aggregateId,event.eventType,
       JSON.stringify(brain),JSON.stringify(growth),JSON.stringify(graph),JSON.stringify(revenuePlan),
       JSON.stringify({...revenueEconomics,averageChargeMinor:avgChargeMinor.toString(),grossRevenueMinor:revenueEconomics.grossRevenueMinor.toString(),variableCostMinor:revenueEconomics.variableCostMinor.toString(),contributionMinor:revenueEconomics.contributionMinor.toString()}),
       JSON.stringify(scenarios.map((s:any)=>({...s,contributionMinor:s.contributionMinor.toString()}))),JSON.stringify(growthPlan),JSON.stringify(copilot),JSON.stringify({ sourceEventId:event.eventId, consumer:'commerce-intelligence', generatedAt:new Date().toISOString() })]);
  });
}
