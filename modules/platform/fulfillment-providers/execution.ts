import { query, withPgTransaction } from '../db/postgres';
import { ingestWebhook, markWebhook } from '../webhooks/inbox';
import { verifyWebhook } from '../security/webhook-signature';
import { recordTrackingEvent } from '../fulfillment-tracking-3';
import { getFulfillmentProvider, providerWebhookSecret } from './registry';
import type { NormalizedTrackingUpdate } from './contracts';

export async function createProviderLabel(shipmentId:string){
  return withPgTransaction(async tx=>{
    const row=(await tx.query<{id:string;order_id:string;carrier:string;service:string;destination:unknown;tracking_number:string|null;status:string;provider_reference:string|null}>(`select id,order_id,carrier,service,destination,tracking_number,status,provider_reference from trust_shipments where id=$1 for update`,[shipmentId])).rows[0];
    if(!row)throw new Error('SHIPMENT_NOT_FOUND');
    if(row.tracking_number)return {duplicate:true,trackingNumber:row.tracking_number};
    if(!['PLANNED','LABEL_CREATED'].includes(row.status))throw new Error(`LABEL_NOT_ALLOWED:${row.status}`);
    const adapter=getFulfillmentProvider(row.carrier);
    const label=await adapter.createLabel({shipmentId:row.id,orderId:row.order_id,service:row.service,destination:row.destination});
    await tx.query(`update trust_shipments set tracking_number=$1,provider_reference=$2,status='LABEL_CREATED',updated_at=now() where id=$3`,[label.trackingNumber,label.providerReference??null,row.id]);
    await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','LABEL_CREATED',now(),$3) on conflict(id) do nothing`,[`${row.id}:LABEL_CREATED:provider`,row.id,`Carrier label created by ${row.carrier}`]);
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.label.created',$1,$2::jsonb)`,[row.id,JSON.stringify({shipmentId:row.id,carrier:row.carrier,trackingNumber:label.trackingNumber,providerReference:label.providerReference??null})]);
    return {duplicate:false,trackingNumber:label.trackingNumber,providerReference:label.providerReference};
  });
}

export async function reconcileShipmentFromProvider(shipmentId:string){
  const row=(await query<{id:string;carrier:string;tracking_number:string|null}>(`select id,carrier,tracking_number from trust_shipments where id=$1`,[shipmentId])).rows[0];
  if(!row)throw new Error('SHIPMENT_NOT_FOUND');
  if(!row.tracking_number)throw new Error('TRACKING_NUMBER_REQUIRED');
  const adapter=getFulfillmentProvider(row.carrier);
  const update=await adapter.getTracking({trackingNumber:row.tracking_number});
  return recordTrackingEvent({shipmentId,status:update.status,occurredAt:update.occurredAt,location:update.location,description:update.description,exceptionCode:update.exceptionCode,etaAt:update.etaAt});
}

export async function receiveShipmentWebhook(input:{rawBody:string;provider:string;eventId:string;signature:string|null;timestamp:string|null;payload:unknown}){
  const secret=providerWebhookSecret(input.provider);
  if(!verifyWebhook(input.rawBody,input.signature,secret))throw new Error('INVALID_WEBHOOK_SIGNATURE');
  if(input.timestamp){const ts=Number(input.timestamp);if(!Number.isFinite(ts)||Math.abs(Date.now()/1000-ts)>300)throw new Error('WEBHOOK_TIMESTAMP_INVALID');}
  const adapter=getFulfillmentProvider(input.provider);
  const normalized=adapter.parseWebhook({eventId:input.eventId,payload:input.payload});
  return withPgTransaction(async tx=>{
    const inbox=await ingestWebhook(tx,{provider:input.provider,eventId:input.eventId,eventType:'shipment.tracking',payload:input.payload,signature:input.signature??undefined});
    if(inbox.duplicate)return {...inbox,shipmentId:normalized.shipmentId};
    const shipment=normalized.shipmentId ? (await tx.query<{id:string}>(`select id from trust_shipments where id=$1`,[normalized.shipmentId])).rows[0] : normalized.trackingNumber ? (await tx.query<{id:string}>(`select id from trust_shipments where carrier=$1 and tracking_number=$2`,[input.provider,normalized.trackingNumber])).rows[0] : undefined;
    if(!shipment){await markWebhook(tx,inbox.id,'failed','SHIPMENT_NOT_RESOLVED');throw new Error('SHIPMENT_NOT_RESOLVED');}
    await tx.query(`insert into trust_shipment_provider_events(provider,event_id,shipment_id,event_type,tracking_number,occurred_at,payload_json,status) values($1,$2,$3,'tracking',$4,$5,$6::jsonb,'PENDING') on conflict(provider,event_id) do nothing`,[input.provider,input.eventId,shipment.id,normalized.trackingNumber??null,normalized.occurredAt,JSON.stringify(input.payload)]);
    await tx.query(`insert into trust_shipment_reconciliation_jobs(provider,event_id,shipment_id,available_at) values($1,$2,$3,now()) on conflict(provider,event_id) do nothing`,[input.provider,input.eventId,shipment.id]);
    return {...inbox,shipmentId:shipment.id,status:'queued'};
  });
}

export async function claimShipmentReconciliationJobs(limit=50){
  if(!Number.isInteger(limit)||limit<1||limit>500)throw new Error('INVALID_LIMIT');
  return query(`with candidates as (select id from trust_shipment_reconciliation_jobs where status in ('PENDING','PROCESSING') and available_at<=now() and (lease_until is null or lease_until<now()) order by available_at asc for update skip locked limit $1) update trust_shipment_reconciliation_jobs j set status='PROCESSING',lease_until=now()+interval '2 minutes',attempts=j.attempts+1,updated_at=now() from candidates c where j.id=c.id returning j.id,j.provider,j.event_id,j.shipment_id,j.attempts`,[limit]);
}

export async function runShipmentReconciliationWorker(limit=50){
  const jobs=(await claimShipmentReconciliationJobs(limit)).rows as Array<{id:string;provider:string;event_id:string;shipment_id:string;attempts:number}>;
  const results=[];
  for(const job of jobs){
    try{
      const row=(await query<{payload_json:Record<string,unknown>}>(`select payload_json from trust_shipment_provider_events where provider=$1 and event_id=$2`,[job.provider,job.event_id])).rows[0];
      if(!row)throw new Error('PROVIDER_EVENT_NOT_FOUND');
      const update=getFulfillmentProvider(job.provider).parseWebhook({eventId:job.event_id,payload:row.payload_json});
      const result=await recordTrackingEvent({shipmentId:job.shipment_id,status:update.status,occurredAt:update.occurredAt,location:update.location,description:update.description,exceptionCode:update.exceptionCode,etaAt:update.etaAt});
      await withPgTransaction(async tx=>{
        await tx.query(`update trust_shipment_provider_events set status='PROCESSED',processed_at=now(),processing_attempts=processing_attempts+1,updated_at=now() where provider=$1 and event_id=$2`,[job.provider,job.event_id]);
        await tx.query(`update trust_shipment_reconciliation_jobs set status='DONE',lease_until=null,last_error=null,processed_at=now(),updated_at=now() where id=$1`,[job.id]);
        await tx.query(`update trust_webhook_inbox set status='processed',processed_at=now(),processing_attempts=processing_attempts+1,updated_at=now() where provider=$1 and event_id=$2`,[job.provider,job.event_id]);
        await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.tracking.reconciled',$1,$2::jsonb)`,[job.shipment_id,JSON.stringify({shipmentId:job.shipment_id,provider:job.provider,eventId:job.event_id,status:update.status,duplicate:result.duplicate})]);
      });
      results.push({ok:true,jobId:job.id,shipmentId:job.shipment_id,status:update.status,duplicate:result.duplicate});
    }catch(error){
      const reason=error instanceof Error?error.message:'RECONCILIATION_FAILED';
      const terminal=job.attempts>=5;
      await query(`update trust_shipment_reconciliation_jobs set status=$2,lease_until=null,last_error=$3,available_at=case when $2='FAILED' then now()+interval '15 minutes' else now()+interval '30 seconds' end,updated_at=now() where id=$1`,[job.id,terminal?'FAILED':'PENDING',reason]);
      await query(`update trust_shipment_provider_events set status=$2,processing_attempts=processing_attempts+1,last_error=$3,updated_at=now() where provider=$1 and event_id=$4`,[job.provider,terminal?'FAILED':'PENDING',reason,job.event_id]);
      results.push({ok:false,jobId:job.id,shipmentId:job.shipment_id,error:reason,terminal});
    }
  }
  return results;
}
