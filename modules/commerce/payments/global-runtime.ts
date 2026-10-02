import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { createPaymentIntent, type PaymentResult } from './orchestrator';
import { assertGlobalPaymentCapability, globalPaymentRequestHash, type GlobalPaymentMethod } from '../../platform/global-payment-v299/runtime';
import { recordGlobalPaymentProviderQueuedTx, recordGlobalPaymentCreatedTx } from '../../platform/global-payment-v300';

export type GlobalPaymentInput = {
  orderId:string; customerId:string; provider:string; method:GlobalPaymentMethod; idempotencyKey:string; paymentIntentId?:string;
};
export type GlobalPaymentResult = PaymentResult & { paymentMethod:GlobalPaymentMethod; destinationCountry:string; attemptId:string; replay:boolean; providerCapability:string };

export async function createGlobalPaymentIntent(db:SqlExecutor,input:GlobalPaymentInput):Promise<GlobalPaymentResult>{
  if(!input.orderId||!input.customerId||!input.provider||!input.idempotencyKey) throw new Error('INVALID_GLOBAL_PAYMENT');
  return db.transaction(async tx=>{
    const order=(await tx.query<any>(`select id,customer_id,status,currency,destination_country,payment_method from trust_orders where id=$1 for update`,[input.orderId])).rows[0];
    if(!order) throw new Error('ORDER_NOT_FOUND');
    if(String(order.customer_id)!==input.customerId) throw new Error('ORDER_ACCESS_DENIED');
    if(!order.destination_country||!order.currency) throw new Error('GLOBAL_PAYMENT_REQUIRES_GLOBAL_ORDER');
    const capability=assertGlobalPaymentCapability({country:String(order.destination_country),currency:String(order.currency),method:input.method,provider:input.provider});
    if(String(order.payment_method)!==input.method) throw new Error('GLOBAL_PAYMENT_METHOD_MISMATCH');
    const requestHash=globalPaymentRequestHash({orderId:input.orderId,customerId:input.customerId,provider:input.provider,method:input.method,paymentIntentId:input.paymentIntentId??null});
    const prior=(await tx.query<any>(`select id,payment_id,status,provider_reference,client_secret from trust_global_payment_attempts where idempotency_key=$1 for update`,[input.idempotencyKey])).rows[0];
    if(prior){
      const existing=(await tx.query<any>(`select request_hash from trust_global_payment_attempts where id=$1`,[prior.id])).rows[0];
      if(existing.request_hash!==requestHash) throw new Error('IDEMPOTENCY_KEY_REUSED');
      if(!prior.payment_id) return { attemptId:String(prior.id), capability:capability.capability, country:String(order.destination_country), currency:String(order.currency), orderTotal:Number(order.total) } as any;
      const p=(await tx.query<any>(`select id,order_id,payment_intent_id,status,amount,currency from trust_payments where id=$1`,[prior.payment_id])).rows[0];
      return {paymentId:String(p.id),orderId:String(p.order_id),paymentIntentId:String(p.payment_intent_id),status:p.status,amount:Number(p.amount),currency:String(p.currency),paymentMethod:input.method,destinationCountry:String(order.destination_country),attemptId:String(prior.id),providerCapability:capability.capability,replay:true};
    }
    const attempt=(await tx.query<any>(`insert into trust_global_payment_attempts(order_id,customer_id,destination_country,currency,payment_method,provider,status,idempotency_key,request_hash,metadata) values($1,$2,$3,$4,$5,$6,'created',$7,$8,$9::jsonb) returning id`,[input.orderId,input.customerId,order.destination_country,order.currency,input.method,input.provider,input.idempotencyKey,requestHash,JSON.stringify({capability:capability.capability,version:'V300.0.0'})])).rows[0];
    await recordGlobalPaymentCreatedTx(tx,String(attempt.id));
    return { attemptId:String(attempt.id), capability:capability.capability, country:String(order.destination_country), currency:String(order.currency), orderTotal:Number(order.total) } as any;
  }).then(async (prepared:any)=>{
    if(prepared.paymentId) return prepared;
    const payment=await createPaymentIntent(db,{orderId:input.orderId,customerId:input.customerId,provider:input.provider,amount:prepared.orderTotal,currency:prepared.currency,idempotencyKey:`global-payment:${input.idempotencyKey}`,paymentIntentId:input.paymentIntentId});
    await db.transaction(async tx=>{
      await tx.query(`update trust_global_payment_attempts set payment_id=$2,status=$3,updated_at=now() where id=$1`,[prepared.attemptId,payment.paymentId,payment.status]);
      await tx.query(`update trust_payments set payment_method=$2,destination_country=$3,global_payment_attempt_id=$4 where id=$1`,[payment.paymentId,input.method,prepared.country,prepared.attemptId]);
      await recordGlobalPaymentProviderQueuedTx(tx,prepared.attemptId);
    });
    return {...payment,paymentMethod:input.method,destinationCountry:prepared.country,attemptId:prepared.attemptId,providerCapability:prepared.capability,replay:false};
  });
}
