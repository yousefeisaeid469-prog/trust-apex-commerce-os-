import { query,withPgTransaction } from '../db/postgres';
import { selectCarrierRoute } from './routing';
import type { CarrierMode } from './contracts';
export async function routeShipmentTx(tx:import('pg').PoolClient,input:{orderId:string;shipmentId?:string|null;country:string;currency:string;mode:CarrierMode;idempotencyKey:string;preferredCarrier?:string;avoidCarriers?:string[]}){
 const prior=(await tx.query(`select * from trust_global_carrier_routes where idempotency_key=$1 for update`,[input.idempotencyKey])).rows[0];
 if(prior)return {replay:true,route:prior};
 const route=selectCarrierRoute(input);
 const row=(await tx.query(`insert into trust_global_carrier_routes(order_id,shipment_id,destination_country,requested_mode,selected_carrier,selected_service,score,route_status,reason,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,'SELECTED',$8::jsonb,$9) returning *`,[input.orderId,input.shipmentId??null,input.country.trim().toUpperCase(),input.mode,route.carrierCode,route.serviceCode,route.score,JSON.stringify({reasons:route.reasons}),route.idempotencyKey])).rows[0];
 if(input.shipmentId) await tx.query(`update trust_shipments set carrier=$2,service=$3,updated_at=now() where id=$1 and status='PLANNED'`,[input.shipmentId,route.carrierCode,route.serviceCode]);
 return {replay:false,route:row};
}
export async function routeShipment(input:{orderId:string;shipmentId?:string|null;country:string;currency:string;mode:CarrierMode;idempotencyKey:string;preferredCarrier?:string;avoidCarriers?:string[]}){return withPgTransaction(tx=>routeShipmentTx(tx,input));}
export async function recordCarrierHealthEventTx(tx:import('pg').PoolClient,carrierCode:string,event:'SUCCESS'|'FAILURE'){
 const row=(await tx.query(`select * from trust_global_carrier_health where carrier_code=$1 for update`,[carrierCode])).rows[0];if(!row)throw new Error('CARRIER_HEALTH_NOT_FOUND');
 const failures=event==='FAILURE'?Number(row.consecutive_failures)+1:0;const state=event==='FAILURE'&&failures>=5?'OPEN':'CLOSED';
 await tx.query(`update trust_global_carrier_health set success_count=success_count+$2,failure_count=failure_count+$3,consecutive_failures=$4,circuit_state=$5,last_success_at=case when $6 then now() else last_success_at end,last_failure_at=case when $6 then last_failure_at else now() end,updated_at=now() where carrier_code=$1`,[carrierCode,event==='SUCCESS'?1:0,event==='FAILURE'?1:0,failures,state,event==='SUCCESS']);
 return {carrierCode,event,consecutiveFailures:failures,circuitState:state};
}
export async function failoverShipmentTx(tx:import('pg').PoolClient,input:{shipmentId:string;orderId:string;country:string;currency:string;mode:CarrierMode;idempotencyKey:string;fromCarrier:string;reason:string}){
 const prior=(await tx.query(`select * from trust_global_carrier_failovers where idempotency_key=$1 for update`,[input.idempotencyKey])).rows[0];if(prior)return {replay:true,failover:prior};
 const route=selectCarrierRoute({country:input.country,currency:input.currency,mode:input.mode,idempotencyKey:`${input.idempotencyKey}:route`,avoidCarriers:[input.fromCarrier]});
 const row=(await tx.query(`insert into trust_global_carrier_failovers(shipment_id,from_carrier,to_carrier,reason,idempotency_key) values($1,$2,$3,$4,$5) returning *`,[input.shipmentId,input.fromCarrier,route.carrierCode,input.reason,input.idempotencyKey])).rows[0];
 await tx.query(`update trust_shipments set carrier=$2,service=$3,updated_at=now() where id=$1 and order_id=$4 and status not in ('DELIVERED','CANCELLED')`,[input.shipmentId,route.carrierCode,route.serviceCode,input.orderId]);
 await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.carrier.failover',$1,$2::jsonb)`,[input.shipmentId,JSON.stringify({shipmentId:input.shipmentId,fromCarrier:input.fromCarrier,toCarrier:route.carrierCode,reason:input.reason})]);
 return {replay:false,failover:row,route};
}
export async function getCarrierNetworkHealth(){return (await query(`select r.carrier_code,r.display_name,r.environment,r.enabled,h.success_count,h.failure_count,h.consecutive_failures,h.circuit_state,h.last_success_at,h.last_failure_at from trust_global_carrier_registry r join trust_global_carrier_health h on h.carrier_code=r.carrier_code order by r.carrier_code`)).rows;}
