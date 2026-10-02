import type { PoolClient } from 'pg';
import type { FulfillmentGateway, IntegrationEvent, PaymentGateway } from './contracts';

export function assertMinorAmount(value:number){ if(!Number.isSafeInteger(value)||value<=0) throw new Error('INVALID_MINOR_AMOUNT'); return value; }
export function toMinorUnits(amount:number){ if(!Number.isFinite(amount)||amount<0) throw new Error('INVALID_MONEY'); const minor=Math.round(amount*100); if(!Number.isSafeInteger(minor)) throw new Error('INVALID_MONEY'); return minor; }

export async function preparePaymentAuthorization(client:PoolClient,input:{orderId:string;customerId:string;amount:number;currency:'EGP';idempotencyKey:string;provider:string}){
  const amountMinor=assertMinorAmount(toMinorUnits(input.amount));
  const prior=await client.query<{id:string;payment_intent_id:string;amount:number|string;status:string;provider:string;provider_reference:string|null}>(
    `select id,payment_intent_id,amount,status,provider,provider_reference from trust_payments where idempotency_key=$1 for update`,[input.idempotencyKey]);
  if(prior.rows[0]) return {paymentId:prior.rows[0].id,paymentIntentId:prior.rows[0].payment_intent_id,status:prior.rows[0].status,providerReference:prior.rows[0].provider_reference,amountMinor,replay:true};
  const order=await client.query<{total:number|string;customer_id:string|null;status:string}>(`select total,customer_id,status from trust_orders where id=$1 for update`,[input.orderId]);
  if(!order.rows[0]) throw new Error('ORDER_NOT_FOUND');
  if(order.rows[0].customer_id!==input.customerId) throw new Error('ORDER_ACCESS_DENIED');
  if(Math.round(Number(order.rows[0].total)*100)!==amountMinor) throw new Error('PAYMENT_AMOUNT_MISMATCH');
  const paymentIntentId=`pi_${crypto.randomUUID()}`;
  const inserted=await client.query<{id:string}>(`insert into trust_payments(order_id,provider,payment_intent_id,amount,currency,status,idempotency_key,metadata) values($1,$2,$3,$4,$5,'pending',$6,$7::jsonb) returning id`,[input.orderId,input.provider,paymentIntentId,input.amount,input.currency,input.idempotencyKey,JSON.stringify({amountMinor})]);
  return {paymentId:inserted.rows[0].id,paymentIntentId,status:'pending',providerReference:undefined,amountMinor,replay:false};
}

export async function finalizePaymentAuthorization(client:PoolClient,gateway:PaymentGateway,input:{paymentId:string;orderId:string;tenantId:string;amountMinor:number;currency:string;idempotencyKey:string}){
  assertMinorAmount(input.amountMinor);
  const payment=await client.query<{id:string;status:string;order_id:string}>(`select id,status,order_id from trust_payments where id=$1 for update`,[input.paymentId]);
  if(!payment.rows[0]) throw new Error('PAYMENT_NOT_FOUND');
  if(payment.rows[0].order_id!==input.orderId) throw new Error('ORDER_ACCESS_DENIED');
  if(payment.rows[0].status!=='pending') return {status:payment.rows[0].status,replay:true};
  const external=await gateway.authorize({tenantId:input.tenantId,amountMinor:input.amountMinor,currency:input.currency,idempotencyKey:input.idempotencyKey});
  const status=external.status==='authorized'?'authorized':'failed';
  await client.query(`update trust_payments set status=$1,metadata=metadata||$2::jsonb,updated_at=now() where id=$3`,[status,JSON.stringify({providerReference:external.providerReference}),input.paymentId]);
  await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`,[status==='authorized'?'payment.authorized':'payment.failed',input.orderId,JSON.stringify({paymentId:input.paymentId,providerReference:external.providerReference,amountMinor:input.amountMinor})]);
  return {status,providerReference:external.providerReference,replay:false};
}

export async function prepareFulfillment(client:PoolClient,input:{orderId:string;idempotencyKey:string;provider:string}){
  const existing=await client.query<{id:string;status:string;provider:string;provider_reference:string|null}>(`select id,status,provider,provider_reference from trust_fulfillment_jobs where idempotency_key=$1 for update`,[input.idempotencyKey]);
  if(existing.rows[0]) return {...existing.rows[0],replay:true};
  const order=await client.query<{status:string}>(`select status from trust_orders where id=$1 for update`,[input.orderId]);
  if(!order.rows[0]) throw new Error('ORDER_NOT_FOUND');
  const row=await client.query<{id:string}>(`insert into trust_fulfillment_jobs(order_id,provider,status,idempotency_key) values($1,$2,'failed',$3) returning id`,[input.orderId,input.provider,input.idempotencyKey]);
  return {id:row.rows[0].id,status:'pending',provider:input.provider,provider_reference:null,replay:false};
}

export async function finalizeFulfillment(client:PoolClient,gateway:FulfillmentGateway,input:{id:string;tenantId:string;orderId:string;idempotencyKey:string}){
  const job=await client.query<{id:string;status:string;provider_reference:string|null}>(`select id,status,provider_reference from trust_fulfillment_jobs where id=$1 for update`,[input.id]);
  if(!job.rows[0]) throw new Error('FULFILLMENT_NOT_FOUND');
  if(job.rows[0].status==='created') return {...job.rows[0],replay:true};
  const external=await gateway.createShipment({tenantId:input.tenantId,orderId:input.orderId,idempotencyKey:input.idempotencyKey});
  await client.query(`update trust_fulfillment_jobs set status=$1,provider_reference=$2,updated_at=now() where id=$3`,[external.status,external.providerReference,input.id]);
  await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`,[external.status==='created'?'fulfillment.created':'fulfillment.failed',input.orderId,JSON.stringify({fulfillmentId:input.id,providerReference:external.providerReference})]);
  return {id:input.id,status:external.status,provider_reference:external.providerReference,replay:false};
}

export async function enqueueOutbox(client:PoolClient,event:IntegrationEvent){
  if(!event.type||!event.aggregateId) throw new Error('INVALID_INTEGRATION_EVENT');
  await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`,[event.type,event.aggregateId,JSON.stringify(event.payload)]);
}
