import {query,withPgTransaction} from '../db/postgres.ts';
import {optimizeNetwork} from './optimizer.ts';
import type {NetworkCapacity,NetworkObjective,NetworkShipment} from './contracts.ts';
export const GLOBAL_LOGISTICS_NETWORK_VERSION='V311.0.0';
export async function previewNetwork(input:{shipments:NetworkShipment[];capacities?:NetworkCapacity[];objective?:NetworkObjective;now?:string;idempotencyKey?:string}){return optimizeNetwork(input.shipments,input.capacities??[],input.objective??'BALANCED',input.now??new Date().toISOString(),input.idempotencyKey??'preview');}
export async function planNetworkTx(tx:import('pg').PoolClient,input:{shipments:NetworkShipment[];capacities?:NetworkCapacity[];objective?:NetworkObjective;now?:string;idempotencyKey:string}){
 const prior=(await tx.query(`select * from trust_global_logistics_network_plans where idempotency_key=$1 for update`,[input.idempotencyKey])).rows[0];if(prior)return {replay:true,plan:prior};
 const plan=await previewNetwork(input);
 const row=(await tx.query(`insert into trust_global_logistics_network_plans(idempotency_key,objective,shipment_count,allocated_count,unallocated_count,carriers_used,total_cost_minor,average_max_days,plan_json,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'PLANNED') returning *`,[input.idempotencyKey,plan.objective,plan.summary.shipments,plan.summary.allocated,plan.summary.unallocated,plan.summary.carriersUsed,plan.summary.totalCostMinor.toString(),plan.summary.averageMaxDays,JSON.stringify({...plan,summary:{...plan.summary,totalCostMinor:plan.summary.totalCostMinor.toString()}})])).rows[0];
 for(const a of plan.allocations){await tx.query(`insert into trust_global_logistics_network_allocations(plan_id,shipment_id,carrier_code,service_code,score,cost_minor,max_days,reliability,reasons) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,[row.id,a.shipmentId,a.carrierCode,a.serviceCode,a.score,a.costMinor.toString(),a.maxDays,a.reliability,JSON.stringify(a.reasons)]);}
 await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.logistics.network.plan.created',$1,$2::jsonb)`,[row.id,JSON.stringify({version:GLOBAL_LOGISTICS_NETWORK_VERSION,planId:row.id,objective:plan.objective,allocated:plan.summary.allocated,unallocated:plan.summary.unallocated})]);
 return {replay:false,plan:row,allocations:plan.allocations,unallocatedShipmentIds:plan.unallocatedShipmentIds};
}
export async function planNetwork(input:{shipments:NetworkShipment[];capacities?:NetworkCapacity[];objective?:NetworkObjective;now?:string;idempotencyKey:string}){return withPgTransaction(tx=>planNetworkTx(tx,input));}
export async function listNetworkPlans(){return (await query(`select * from trust_global_logistics_network_plans order by created_at desc limit 100`)).rows;}
