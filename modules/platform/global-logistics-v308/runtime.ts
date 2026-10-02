import type {PoolClient} from 'pg';
import {query,withPgTransaction} from '../db/postgres';
import {assessLogisticsRisk,type ControlTowerShipment} from './contracts';
export const GLOBAL_LOGISTICS_CONTROL_TOWER_VERSION='V308.0.0';

function mapRow(row:any,now:string):ControlTowerShipment{
  const input={shipmentStatus:String(row.shipment_status),etaAt:row.eta_at?new Date(row.eta_at).toISOString():null,lastEventAt:row.last_event_at?new Date(row.last_event_at).toISOString():null,executionStatus:row.execution_status?String(row.execution_status):null,executionAttempts:Number(row.execution_attempts??0),lastExecutionError:row.last_execution_error??null,openExceptions:Number(row.open_exceptions??0),criticalExceptions:Number(row.critical_exceptions??0),now};
  return {shipmentId:String(row.shipment_id),orderId:String(row.order_id),carrierCode:String(row.carrier_code),trackingNumber:row.tracking_number?String(row.tracking_number):null,shipmentStatus:input.shipmentStatus,etaAt:input.etaAt,lastEventAt:input.lastEventAt,executionStatus:input.executionStatus,executionAttempts:input.executionAttempts,lastExecutionError:input.lastExecutionError,openExceptions:input.openExceptions,criticalExceptions:input.criticalExceptions,assessment:assessLogisticsRisk(input)};
}

async function loadRows(orderId?:string){
  const params=orderId?[orderId]:[];
  const where=orderId?'where s.order_id=$1 and s.status not in (\'CANCELLED\')':'';
  return (await query(`select s.id shipment_id,s.order_id,s.carrier carrier_code,s.tracking_number,s.status shipment_status,s.eta_at,
    s.last_carrier_event_at last_event_at,
    ex.status execution_status,coalesce(ex.attempts,0) execution_attempts,ex.last_error last_execution_error,
    coalesce(x.open_exceptions,0) open_exceptions,coalesce(x.critical_exceptions,0) critical_exceptions
    from trust_shipments s
    left join lateral (select e.status,e.attempts,e.last_error from trust_global_logistics_executions e where e.shipment_id=s.id order by e.created_at desc limit 1) ex on true
    left join lateral (select count(*) filter(where e.status<>'RESOLVED')::int open_exceptions,count(*) filter(where e.status<>'RESOLVED' and e.severity='CRITICAL')::int critical_exceptions from trust_global_fulfillment_exceptions e where e.shipment_id=s.id) x on true
    ${where} order by s.updated_at desc`,params)).rows;
}

export async function getGlobalLogisticsControlTower(orderId:string,now=new Date().toISOString()){
  const shipments= (await loadRows(orderId)).map(row=>mapRow(row,now));
  const summary={shipments:shipments.length,red:shipments.filter(x=>x.assessment.riskBand==='RED').length,amber:shipments.filter(x=>x.assessment.riskBand==='AMBER').length,green:shipments.filter(x=>x.assessment.riskBand==='GREEN').length,openExceptions:shipments.reduce((n,x)=>n+x.openExceptions,0),criticalExceptions:shipments.reduce((n,x)=>n+x.criticalExceptions,0)};
  return {version:GLOBAL_LOGISTICS_CONTROL_TOWER_VERSION,orderId,summary,shipments};
}

export async function getGlobalLogisticsFleetControlTower(now=new Date().toISOString()){
  const shipments=(await loadRows()).map(row=>mapRow(row,now));
  const byCarrier=new Map<string,{carrierCode:string;shipments:number;red:number;amber:number;green:number;openExceptions:number}>();
  for(const s of shipments){const current=byCarrier.get(s.carrierCode)??{carrierCode:s.carrierCode,shipments:0,red:0,amber:0,green:0,openExceptions:0};current.shipments++;current[s.assessment.riskBand.toLowerCase() as 'red'|'amber'|'green']++;current.openExceptions+=s.openExceptions;byCarrier.set(s.carrierCode,current);}
  return {version:GLOBAL_LOGISTICS_CONTROL_TOWER_VERSION,summary:{shipments:shipments.length,red:shipments.filter(x=>x.assessment.riskBand==='RED').length,amber:shipments.filter(x=>x.assessment.riskBand==='AMBER').length,green:shipments.filter(x=>x.assessment.riskBand==='GREEN').length,openExceptions:shipments.reduce((n,x)=>n+x.openExceptions,0),criticalExceptions:shipments.reduce((n,x)=>n+x.criticalExceptions,0)},carriers:[...byCarrier.values()].sort((a,b)=>b.red-a.red||b.openExceptions-a.openExceptions),shipments};
}

export async function snapshotGlobalLogisticsControlTowerTx(tx:PoolClient,orderId:string,now=new Date().toISOString()){
  const rows=(await tx.query<any>(`select s.id shipment_id,s.order_id,s.carrier carrier_code,s.tracking_number,s.status shipment_status,s.eta_at,s.last_carrier_event_at last_event_at,
    ex.status execution_status,coalesce(ex.attempts,0) execution_attempts,ex.last_error last_execution_error,
    coalesce(x.open_exceptions,0) open_exceptions,coalesce(x.critical_exceptions,0) critical_exceptions
    from trust_shipments s
    left join lateral (select e.status,e.attempts,e.last_error from trust_global_logistics_executions e where e.shipment_id=s.id order by e.created_at desc limit 1) ex on true
    left join lateral (select count(*) filter(where e.status<>'RESOLVED')::int open_exceptions,count(*) filter(where e.status<>'RESOLVED' and e.severity='CRITICAL')::int critical_exceptions from trust_global_fulfillment_exceptions e where e.shipment_id=s.id) x on true
    where s.order_id=$1 and s.status<>'CANCELLED' for update`,[orderId])).rows;
  const snapshots=[];
  for(const row of rows){const item=mapRow(row,now);const r=item.assessment;const saved=(await tx.query<any>(`insert into trust_global_logistics_control_tower_snapshots(order_id,shipment_id,carrier_code,tracking_number,shipment_status,eta_at,last_event_at,risk_band,risk_score,risk_reasons,recommended_action,execution_status,execution_attempts,open_exceptions,critical_exceptions,snapshot_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16) returning id,snapshot_at`,[item.orderId,item.shipmentId,item.carrierCode,item.trackingNumber,item.shipmentStatus,item.etaAt,item.lastEventAt,r.riskBand,r.riskScore,JSON.stringify(r.riskReasons),r.recommendedAction,item.executionStatus,item.executionAttempts,item.openExceptions,item.criticalExceptions,now])).rows[0];snapshots.push({...item,snapshotId:String(saved.id),snapshotAt:new Date(saved.snapshot_at).toISOString()});}
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.logistics.control_tower.snapshot',$1,$2::jsonb)`,[orderId,JSON.stringify({orderId,version:GLOBAL_LOGISTICS_CONTROL_TOWER_VERSION,shipmentCount:snapshots.length,redCount:snapshots.filter(x=>x.assessment.riskBand==='RED').length})]);
  return {version:GLOBAL_LOGISTICS_CONTROL_TOWER_VERSION,orderId,snapshots};
}
export async function snapshotGlobalLogisticsControlTower(orderId:string){return withPgTransaction(tx=>snapshotGlobalLogisticsControlTowerTx(tx,orderId));}
