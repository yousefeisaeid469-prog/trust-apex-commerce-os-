import { query,withPgTransaction } from '../db/postgres.ts';
import { listCarriers,listCarrierServices } from '../global-carrier-v304/registry.ts';
import type { CarrierMode } from '../global-carrier-v304/contracts.ts';
import { reliabilityScore,scoreCandidates } from './scoring.ts';
import type { LogisticsDecision,LogisticsPriority } from './contracts.ts';
export function rankLogistics(input:{country:string;currency:string;mode:CarrierMode;priority?:LogisticsPriority;health?:Record<string,{successCount:number;failureCount:number;circuitState:string}>}):LogisticsDecision['candidates']{
 const country=input.country.trim().toUpperCase(),currency=input.currency.trim().toUpperCase(),health=input.health??{};
 const candidates=[];
 for(const carrier of listCarriers()){
  if(!carrier.enabled||(carrier.countries[0]!=='*'&&!carrier.countries.includes(country))||(carrier.currencies[0]!=='*'&&!carrier.currencies.includes(currency))) continue;
  const service=listCarrierServices(country,input.mode).find(s=>s.carrierCode===carrier.carrierCode&&s.currency===currency); if(!service) continue;
  const h=health[carrier.carrierCode]??{successCount:0,failureCount:0,circuitState:'CLOSED'};
  if(h.circuitState==='OPEN') continue;
  candidates.push({carrierCode:carrier.carrierCode,serviceCode:service.serviceCode,costMinor:service.basePriceMinor,minDays:service.minDays,maxDays:service.maxDays,reliability:reliabilityScore(h.successCount,h.failureCount,h.circuitState),score:0,reasons:[]});
 }
 return scoreCandidates(candidates,input.priority??'BALANCED');
}
export function chooseLogisticsDecision(input:{country:string;currency:string;mode:CarrierMode;priority?:LogisticsPriority;decisionIdempotencyKey:string;health?:Record<string,{successCount:number;failureCount:number;circuitState:string}>}):LogisticsDecision{
 if(!input.decisionIdempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
 const candidates=rankLogistics(input); if(!candidates.length) throw new Error('NO_LOGISTICS_ROUTE_AVAILABLE');
 const best=candidates[0]; return {country:input.country.trim().toUpperCase(),currency:input.currency.trim().toUpperCase(),mode:input.mode,priority:input.priority??'BALANCED',selectedCarrier:best.carrierCode,selectedService:best.serviceCode,score:best.score,candidates,decisionIdempotencyKey:input.decisionIdempotencyKey.trim()};
}
export async function chooseLogisticsTx(tx:import('pg').PoolClient,input:{orderId:string;shipmentId?:string|null;country:string;currency:string;mode:CarrierMode;priority?:LogisticsPriority;decisionIdempotencyKey:string}){
 const prior=(await tx.query(`select * from trust_global_logistics_decisions where idempotency_key=$1 for update`,[input.decisionIdempotencyKey])).rows[0]; if(prior) return {replay:true,decision:prior};
 const healthRows=(await tx.query(`select carrier_code,success_count,failure_count,circuit_state from trust_global_carrier_health`)).rows;
 const health=Object.fromEntries(healthRows.map((r:any)=>[r.carrier_code,{successCount:Number(r.success_count),failureCount:Number(r.failure_count),circuitState:r.circuit_state}]));
 const decision=chooseLogisticsDecision({...input,health});
 const row=(await tx.query(`insert into trust_global_logistics_decisions(order_id,shipment_id,destination_country,currency,requested_mode,priority,selected_carrier,selected_service,score,candidate_evidence,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) returning *`,[input.orderId,input.shipmentId??null,decision.country,decision.currency,input.mode,decision.priority,decision.selectedCarrier,decision.selectedService,decision.score,JSON.stringify(decision.candidates.map(c=>({...c,costMinor:c.costMinor.toString()}))),decision.decisionIdempotencyKey])).rows[0];
 return {replay:false,decision:row};
}
export async function chooseLogistics(input:{orderId:string;shipmentId?:string|null;country:string;currency:string;mode:CarrierMode;priority?:LogisticsPriority;decisionIdempotencyKey:string}){return withPgTransaction(tx=>chooseLogisticsTx(tx,input));}
export async function listLogisticsDecisions(orderId:string){return (await query(`select * from trust_global_logistics_decisions where order_id=$1 order by created_at desc`,[orderId])).rows;}
