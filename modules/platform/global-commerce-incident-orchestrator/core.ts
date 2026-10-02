import { query } from '../db/postgres.ts';
import { executeControlCommand } from '../global-commerce-control-plane/core.ts';

export type IncidentKind = 'WORK_STALLED'|'PAYMENT_FAILURE_CLUSTER'|'INVENTORY_PRESSURE';
export type IncidentSeverity = 'MEDIUM'|'HIGH';

function bounded(n:number,min=1,max=100){ return Math.min(Math.max(Math.floor(n),min),max); }

export async function discoverCommerceIncidents(limit=50){
  const safe=bounded(limit);
  const [stalled, payments, inventory] = await Promise.all([
    query<any>(`select coalesce(e.payload->>'orderId',e.aggregate_id::text) order_id,
      count(*) filter(where d.status='PROCESSING' and d.locked_at < now()-interval '2 minutes')::int stale_consumer,
      0::int stale_execution
      from trust_event_deliveries d join trust_commerce_events e on e.tenant_id=d.tenant_id and e.event_id=d.event_id
      where d.status='PROCESSING' and d.locked_at < now()-interval '2 minutes'
      group by 1 having count(*) filter(where d.status='PROCESSING' and d.locked_at < now()-interval '2 minutes')>0
      order by stale_consumer desc limit $1`,[safe]),
    query<any>(`select count(*)::int failures from trust_payments where status in ('failed','FAILED','CANCELED','CANCELLED') and updated_at>=now()-interval '1 hour'`),
    query<any>(`select count(*)::int pressure from trust_inventory_reservations where status in ('RESERVED','EXPIRED') and created_at>=now()-interval '1 hour'`)
  ]);
  const out:any[]=[];
  for(const r of stalled.rows){
    const orderId=String(r.order_id||'');
    if(!orderId) continue;
    out.push({fingerprint:`WORK_STALLED:${orderId}`,kind:'WORK_STALLED' as IncidentKind,severity:'HIGH' as IncidentSeverity,scope:{orderId},evidence:{staleConsumer:Number(r.stale_consumer||0),staleExecution:Number(r.stale_execution||0)},safeAction:{commandId:'RECOVER_ORDER_LEASES',orderId,requiresOwner:true}});
  }
  const failures=Number(payments.rows[0]?.failures||0);
  if(failures>0) out.push({fingerprint:'PAYMENT_FAILURE_CLUSTER:1h',kind:'PAYMENT_FAILURE_CLUSTER',severity:'MEDIUM',scope:{window:'1h'},evidence:{failures},safeAction:null});
  const pressure=Number(inventory.rows[0]?.pressure||0);
  if(pressure>0) out.push({fingerprint:'INVENTORY_PRESSURE:1h',kind:'INVENTORY_PRESSURE',severity:'MEDIUM',scope:{window:'1h'},evidence:{reservations:pressure},safeAction:null});
  return out.slice(0,safe);
}

export async function persistIncidentSnapshot(incidents:any[]){
  const snapshotKey=`incident:${new Date().toISOString().slice(0,13)}`;
  await query(`insert into trust_commerce_incident_snapshots(snapshot_key,version,incident_count,payload,captured_at) values($1,'V376.0.0',$2,$3::jsonb,now()) on conflict(snapshot_key) do update set incident_count=excluded.incident_count,payload=excluded.payload,captured_at=excluded.captured_at`,[snapshotKey,incidents.length,JSON.stringify(incidents)]);
  return snapshotKey;
}

export async function executeSafeIncidentAction(input:{fingerprint:string;commandId:'RECOVER_ORDER_LEASES';orderId:string;actorEmail:string;reason:string;requestId?:string}){
  const incidents=await discoverCommerceIncidents(100);
  const incident=incidents.find(x=>x.fingerprint===input.fingerprint);
  if(!incident) throw new Error('INCIDENT_NOT_ACTIVE');
  if(!incident.safeAction || incident.safeAction.commandId!==input.commandId || incident.safeAction.orderId!==input.orderId) throw new Error('ACTION_NOT_ALLOWED');
  return executeControlCommand({commandId:input.commandId,orderId:input.orderId,actorEmail:input.actorEmail,reason:input.reason,requestId:input.requestId});
}
