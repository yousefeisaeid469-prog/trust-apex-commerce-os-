import { query, withPgTransaction } from '../db/postgres';
import { appendAuditEvent } from '../audit/service';

export type FulfillmentRisk='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type ExceptionAction='ACKNOWLEDGE'|'RESOLVE'|'ESCALATE';

function riskFor(input:{late:boolean;exception:boolean;status:string;hoursToEta:number|null;ageHours:number}):FulfillmentRisk{
  if(input.exception && input.late)return 'CRITICAL';
  if(input.exception || input.late)return 'HIGH';
  if(input.hoursToEta!==null && input.hoursToEta<6)return 'MEDIUM';
  if(input.ageHours>72 && !['DELIVERED','CANCELLED'].includes(input.status))return 'MEDIUM';
  return 'LOW';
}

export async function getFulfillmentRiskSnapshot(limit=100){
  if(!Number.isInteger(limit)||limit<1||limit>500)throw new Error('INVALID_LIMIT');
  const rows=(await query(`select s.id,s.order_id,s.carrier,s.service,s.tracking_number,s.status,s.eta_at,s.created_at,s.updated_at,(select e.exception_code from trust_shipment_tracking_events e where e.shipment_id=s.id and e.event_type='EXCEPTION' order by e.occurred_at desc limit 1) as exception_code,(select e.occurred_at from trust_shipment_tracking_events e where e.shipment_id=s.id and e.event_type='EXCEPTION' order by e.occurred_at desc limit 1) as exception_at from trust_shipments s where s.status not in ('DELIVERED','CANCELLED') order by case when s.eta_at<now() then 0 when s.status='EXCEPTION' then 1 else 2 end,s.eta_at nulls last,s.updated_at asc limit $1`,[limit])).rows as Array<Record<string,unknown>>;
  const now=Date.now();
  const items=rows.map(r=>{const eta=r.eta_at?new Date(String(r.eta_at)).getTime():null;const hoursToEta=eta===null?null:(eta-now)/3600000;const ageHours=(now-new Date(String(r.created_at)).getTime())/3600000;const late=eta!==null&&eta<now;const exception=Boolean(r.exception_code);return {...r,late,ageHours:Number(ageHours.toFixed(1)),hoursToEta:hoursToEta===null?null:Number(hoursToEta.toFixed(1)),risk:riskFor({late,exception,status:String(r.status),hoursToEta,ageHours}),action:late?'ESCALATE':exception?'REVIEW':'MONITOR'};});
  return {generatedAt:new Date().toISOString(),items,summary:{critical:items.filter(x=>x.risk==='CRITICAL').length,high:items.filter(x=>x.risk==='HIGH').length,medium:items.filter(x=>x.risk==='MEDIUM').length,low:items.filter(x=>x.risk==='LOW').length}};
}

export async function applyExceptionAction(input:{shipmentId:string;action:ExceptionAction;note:string;actorId:string}){
  const note=input.note.trim();if(!note)throw new Error('EXCEPTION_NOTE_REQUIRED');if(note.length>2000)throw new Error('EXCEPTION_NOTE_TOO_LONG');
  return withPgTransaction(async tx=>{
    const shipment=(await tx.query<{id:string;order_id:string;status:string}>(`select id,order_id,status from trust_shipments where id=$1 for update`,[input.shipmentId])).rows[0];if(!shipment)throw new Error('SHIPMENT_NOT_FOUND');
    const event=(await tx.query<{id:string;exception_code:string|null}>(`select id,exception_code from trust_shipment_tracking_events where shipment_id=$1 and event_type='EXCEPTION' order by occurred_at desc limit 1`,[input.shipmentId])).rows[0];if(!event)throw new Error('NO_ACTIVE_EXCEPTION');
    const actionId=`${input.shipmentId}:${input.action}:${Date.now()}`;
    await tx.query(`insert into trust_shipment_exception_actions(id,shipment_id,tracking_event_id,action,note,actor_id) values($1,$2,$3,$4,$5,$6)`,[actionId,input.shipmentId,event.id,input.action,note,input.actorId]);
    if(input.action==='RESOLVE'&&shipment.status==='EXCEPTION'){
      await tx.query(`update trust_shipments set status='IN_TRANSIT',updated_at=now() where id=$1`,[input.shipmentId]);
      await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','IN_TRANSIT',now(),$3) on conflict(id) do nothing`,[`${actionId}:resume`,input.shipmentId,`Exception resolved: ${note}`]);
    }
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.exception.actioned',$1,$2::jsonb)`,[input.shipmentId,JSON.stringify({shipmentId:input.shipmentId,action:input.action,note,actorId:input.actorId,trackingEventId:event.id})]);
    return {actionId,shipmentId:input.shipmentId,action:input.action,status:input.action==='RESOLVE'?'IN_TRANSIT':shipment.status};
  });
}
