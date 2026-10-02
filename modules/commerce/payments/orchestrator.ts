import { startWorkflowTx, registerWorkflow } from '../../platform/workflow-orchestrator';
import { releaseOrderReservationsTx } from '../inventory/reservations';
import { createHmac, timingSafeEqual } from 'crypto';
import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureIdempotency, requestHash, saveIdempotency } from '../../platform/persistence/transaction-store';
import { assertTransition, orderStatusForPayment, type PaymentStatus } from './state-machine';
import { queueOrderStatusNotificationsTx } from '../../platform/notifications-3';
import { reversePromotionApplicationsTx } from '../../marketplace/promotions';
import { settleCapturedPaymentTx } from '../../marketplace/economic-settlement';
import { reverseSellerSettlementForRefundTx, reverseSellerSettlementForReturnTx } from '../../marketplace/financial-loop';
import { settleSellerDisputeRefundTx } from '../../marketplace/seller-disputes';
import { recordPostSaleFinancialEventTx, postRefundAccountingTx } from '../../platform/post-sale-finance';
import { recordGlobalPaymentLifecycleTx } from '../../platform/global-payment-v300';
import { orchestrateCapturedGlobalOrderTx } from '../../platform/global-order-v301';
import { startCapturedOrderKernelTx } from '../core/execution-kernel';
import { ensureOrderRuntimeOperationTx, transitionRuntimeOperationTx } from '../../platform/runtime-spine';
import { refreshCommerceExecutionGraphTx } from '../core/execution-graph';

export type PaymentCommand = { orderId:string; customerId:string; provider:string; amount?:number; currency?:string; idempotencyKey:string; paymentIntentId?:string };
export type PaymentResult = { paymentId:string; orderId:string; paymentIntentId:string; status:PaymentStatus; amount:number; currency:string; replay:boolean };

function requirePositiveAmount(amount:number){ if(!Number.isFinite(amount)||amount<=0) throw new Error('INVALID_PAYMENT_AMOUNT'); }

/**
 * Validate provider-reported money when a webhook includes it. The payment row
 * remains authoritative, while this check prevents an authenticated provider
 * event from silently disagreeing with the order that TRUST recorded.
 * Providers may omit these optional fields; in that case there is no client
 * supplied amount to trust, and the stored payment amount remains authoritative.
 */
export function assertWebhookMoney(input:{expectedAmount:number;expectedCurrency:string;reportedAmount?:unknown;reportedCurrency?:unknown}){
  if(input.reportedAmount!==undefined){
    const amount=Number(input.reportedAmount);
    if(!Number.isFinite(amount)||amount<0) throw new Error('INVALID_WEBHOOK_AMOUNT');
    if(Math.abs(amount-input.expectedAmount)>0.000001) throw new Error('WEBHOOK_AMOUNT_MISMATCH');
  }
  if(input.reportedCurrency!==undefined){
    const currency=String(input.reportedCurrency).trim().toUpperCase();
    if(!/^[A-Z]{3}$/.test(currency)) throw new Error('INVALID_WEBHOOK_CURRENCY');
    if(currency!==input.expectedCurrency.trim().toUpperCase()) throw new Error('WEBHOOK_CURRENCY_MISMATCH');
  }
}
export async function createPaymentIntent(db:SqlExecutor,input:PaymentCommand):Promise<PaymentResult>{
  if(!input.orderId||!input.customerId||!input.provider||!input.idempotencyKey) throw new Error('INVALID_PAYMENT');
  if(input.amount !== undefined) requirePositiveAmount(Number(input.amount));
  return db.transaction(async tx=>{
    // The order total and currency are authoritative. A browser/client must never be
    // able to choose the amount that gets charged. Optional amount/currency values are
    // accepted only as consistency assertions for trusted internal callers.
    const order=await tx.query<{total:number|string;status:string;customer_id:string;currency:string}>('select total,status,customer_id,currency from trust_orders where id=$1 for update',[input.orderId]);
    if(!order.rows[0]) throw new Error('ORDER_NOT_FOUND');
    if(order.rows[0].customer_id !== input.customerId) throw new Error('ORDER_ACCESS_DENIED');
    if(['cancelled','refunded'].includes(order.rows[0].status)) throw new Error('ORDER_NOT_PAYABLE');
    const amount=Number(order.rows[0].total);
    const currency=String(order.rows[0].currency).toUpperCase();
    if(!Number.isFinite(amount)||amount<=0) throw new Error('ORDER_TOTAL_INVALID');
    if(input.amount !== undefined && Math.abs(Number(input.amount)-amount)>0.000001) throw new Error('PAYMENT_AMOUNT_MISMATCH');
    if(input.currency !== undefined && String(input.currency).toUpperCase()!==currency) throw new Error('PAYMENT_CURRENCY_MISMATCH');
    const expectedHash=requestHash('payment.create',{orderId:input.orderId,customerId:input.customerId,provider:input.provider,amount,currency,paymentIntentId:input.paymentIntentId??null});
    const cached=await ensureIdempotency(tx,input.idempotencyKey,'payment.create',expectedHash);
    if(cached) return {...cached as PaymentResult,replay:true};
    const paymentIntentId=input.paymentIntentId ?? `pi_trust_${cryptoRandom()}`;
    const inserted=await tx.query<{id:string}>("insert into trust_payments(order_id,provider,payment_intent_id,amount,currency,status,idempotency_key) values($1,$2,$3,$4,$5,'pending',$6) on conflict(idempotency_key) do nothing returning id",[input.orderId,input.provider,paymentIntentId,amount,currency,input.idempotencyKey]);
    if(!inserted.rows[0]){const prior=await tx.query<{id:string;order_id:string;payment_intent_id:string;amount:number|string;status:PaymentStatus}>('select id,order_id,payment_intent_id,amount,status from trust_payments where idempotency_key=$1 for update',[input.idempotencyKey]);if(!prior.rows[0])throw new Error('PAYMENT_RETRY_REQUIRED');if(prior.rows[0].order_id!==input.orderId||Number(prior.rows[0].amount)!==amount)throw new Error('IDEMPOTENCY_KEY_REUSED');return {paymentId:prior.rows[0].id,orderId:prior.rows[0].order_id,paymentIntentId:prior.rows[0].payment_intent_id,status:prior.rows[0].status,amount:Number(prior.rows[0].amount),currency:input.currency,replay:true};}
    const result:PaymentResult={paymentId:inserted.rows[0].id,orderId:input.orderId,paymentIntentId,status:'pending',amount,currency:input.currency,replay:false};
    await tx.query('insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)',['payment.pending',input.orderId,JSON.stringify(result)]);
    await tx.query(`insert into trust_payment_provider_jobs(kind,payment_id,provider,idempotency_key) values('CREATE_PAYMENT',$1,$2,$3) on conflict(idempotency_key) do nothing`,[inserted.rows[0].id,input.provider,`payment:${input.idempotencyKey}`]);
    await saveIdempotency(tx,input.idempotencyKey,'payment.create',result,86400,expectedHash);
    return result;
  });
}
function cryptoRandom(){ return globalThis.crypto?.randomUUID?.() ?? `pi_${Date.now()}_${Math.random().toString(36).slice(2)}`; }
export function verifyWebhookSignature(rawBody:string,signature:string,secret:string){
  if(!signature||!secret) return false; const expected=createHmac('sha256',secret).update(rawBody).digest('hex');
  const a=Buffer.from(expected,'utf8'),b=Buffer.from(signature,'utf8'); return a.length===b.length&&timingSafeEqual(a,b);
}
export async function applyPaymentEvent(db:SqlExecutor,input:{provider:string;eventId:string;paymentIntentId:string;status:PaymentStatus;payload:unknown;webhookInboxId?:string}):Promise<{ok:true;duplicate:boolean;paymentId?:string}>{
  const validStatuses: PaymentStatus[] = ['pending','requires_action','authorized','captured','failed','cancelled','refunded','partially_refunded'];
  if(!validStatuses.includes(input.status)) throw new Error('INVALID_PAYMENT_EVENT_STATUS');
  return db.transaction(async tx=>{
    const insertedEvent=await tx.query<{id:string}>(`insert into trust_payment_events(provider,provider_event_id,payment_intent_id,status,payload_json,webhook_inbox_id) values($1,$2,$3,$4,$5::jsonb,$6) on conflict(provider,provider_event_id) do nothing returning id`,[input.provider,input.eventId,input.paymentIntentId,input.status,JSON.stringify(input.payload),input.webhookInboxId??null]);
    if(!insertedEvent.rows[0]) return {ok:true,duplicate:true};
    const payment=await tx.query<{id:string;order_id:string;status:PaymentStatus;amount:number|string;currency:string}>('select id,order_id,status,amount,currency from trust_payments where provider=$1 and payment_intent_id=$2 for update',[input.provider,input.paymentIntentId]);
    if(!payment.rows[0]) throw new Error('PAYMENT_NOT_FOUND');
    const runtime=await ensureOrderRuntimeOperationTx(tx,String(payment.rows[0].order_id),{correlationId:String(input.paymentIntentId),causationId:String(insertedEvent.rows[0].id),metadata:{source:'payment.webhook',provider:input.provider}});
    if(['pending','requires_action','authorized'].includes(input.status)) await transitionRuntimeOperationTx(tx,runtime.operationId,'WAITING',{eventType:`payment.${input.status}`,payload:{paymentId:String(payment.rows[0].id),provider:input.provider}});
    else if(input.status==='failed'||input.status==='cancelled') await transitionRuntimeOperationTx(tx,runtime.operationId,'FAILED',{eventType:`payment.${input.status}`,errorCode:`PAYMENT_${input.status.toUpperCase()}`,payload:{paymentId:String(payment.rows[0].id)}});
    const payload=input.payload as any;
    assertWebhookMoney({
      expectedAmount:Number(payment.rows[0].amount),
      expectedCurrency:String(payment.rows[0].currency),
      reportedAmount:payload?.amount,
      reportedCurrency:payload?.currency,
    });
    assertTransition(payment.rows[0].status,input.status);
    await tx.query('update trust_payments set status=$1,updated_at=now() where id=$2',[input.status,payment.rows[0].id]);
    const globalAttempt=(await tx.query<{id:string}>('select id from trust_global_payment_attempts where payment_id=$1 for update',[payment.rows[0].id])).rows[0];
    if(globalAttempt) await recordGlobalPaymentLifecycleTx(tx,{attemptId:String(globalAttempt.id),status:input.status,provider:input.provider,providerReference:typeof (input.payload as any)?.providerReference==='string' ? (input.payload as any).providerReference : null,payload:input.payload});
    if(input.status==='captured'){ await settleCapturedPaymentTx(tx,{paymentId:payment.rows[0].id,orderId:payment.rows[0].order_id,idempotencyKey:`payment-settlement:${payment.rows[0].id}`}); }
    const orderStatus=orderStatusForPayment(input.status);
    if(orderStatus){
      const order=await tx.query<{status:string;customer_id:string|null}>('select status,customer_id from trust_orders where id=$1 for update',[payment.rows[0].order_id]);
      const fromStatus=order.rows[0]?.status;
      await tx.query('update trust_orders set status=$1,updated_at=now() where id=$2',[orderStatus,payment.rows[0].order_id]);
      if(fromStatus && fromStatus!==orderStatus) await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,$3,'payment_webhook','Payment state transition')`,[payment.rows[0].order_id,fromStatus,orderStatus]);
      if(order.rows[0]?.customer_id && fromStatus!==orderStatus) await queueOrderStatusNotificationsTx(tx,{orderId:payment.rows[0].order_id,customerId:order.rows[0].customer_id,status:orderStatus});
    }
    if(input.status==='captured'){
      await transitionRuntimeOperationTx(tx,runtime.operationId,'RUNNING',{eventType:'payment.captured',payload:{paymentId:String(payment.rows[0].id)}});
      await startCapturedOrderKernelTx(tx,{orderId:payment.rows[0].order_id,paymentId:payment.rows[0].id,idempotencyKey:`commerce-order:${payment.rows[0].order_id}:capture`});
      await orchestrateCapturedGlobalOrderTx(tx,{orderId:payment.rows[0].order_id,paymentId:payment.rows[0].id,idempotencyKey:`global-order:${payment.rows[0].order_id}:capture`});
      registerWorkflow({type:'order-journey',aggregateType:'order',steps:[{key:'start-execution',commandType:'commerce.order.start-execution',payload:{orderId:payment.rows[0].order_id,paymentId:payment.rows[0].id}},{key:'await-delivery',stepType:'WAIT_FOR_EVENT',waitEventType:'commerce.order.delivered',waitEventKey:`order:${payment.rows[0].order_id}`},{key:'complete-delivery',commandType:'commerce.order.complete-delivery',payload:{orderId:payment.rows[0].order_id}}]});
      await startWorkflowTx(tx,{tenantId:'default',workflowType:'order-journey',aggregateType:'order',aggregateId:payment.rows[0].order_id,input:{orderId:payment.rows[0].order_id,paymentId:payment.rows[0].id},correlationId:String(payment.rows[0].id),causationId:String(insertedEvent.rows[0].id),idempotencyKey:`payment-capture:${payment.rows[0].id}`});
      await refreshCommerceExecutionGraphTx(tx,String(payment.rows[0].order_id));
    }
    if(orderStatus==='cancelled'){
      // payment_failed_release: a pre-fulfillment failure releases every durable inventory reservation exactly once.
      // trust_inventory_reservations / payment_failed_release: release pre-fulfillment reservations atomically.
      await releaseOrderReservationsTx(tx, payment.rows[0].order_id, 'PAYMENT_FAILED');
    }
    await tx.query('insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)',['payment.status_changed',payment.rows[0].order_id,JSON.stringify({paymentId:payment.rows[0].id,status:input.status})]);
    return {ok:true,duplicate:false,paymentId:payment.rows[0].id};
  });
}
export async function requestRefund(db:SqlExecutor,input:{paymentId:string;amount:number;reason?:string;idempotencyKey:string}){
  if(!input.paymentId||!input.idempotencyKey||!Number.isFinite(input.amount)||input.amount<=0) throw new Error('INVALID_REFUND');
  return db.transaction(async tx=>{
    const expectedHash=requestHash('refund.create',{paymentId:input.paymentId,amount:input.amount,reason:input.reason??null});
    const cached=await ensureIdempotency(tx,input.idempotencyKey,'refund.create',expectedHash); if(cached) return {...cached as object,replay:true};
    const p=await tx.query<{id:string;order_id:string;amount:number|string;status:PaymentStatus;currency:string}>('select id,order_id,amount,status,currency from trust_payments where id=$1 for update',[input.paymentId]);
    if(!p.rows[0]) throw new Error('PAYMENT_NOT_FOUND'); if(!['captured','partially_refunded'].includes(p.rows[0].status)) throw new Error('PAYMENT_NOT_REFUNDABLE');
    const already=await tx.query<{total:number|string}>('select coalesce(sum(amount),0) total from trust_refunds where payment_id=$1 and status in (\'requested\',\'processing\',\'succeeded\')',[input.paymentId]);
    if(Number(already.rows[0].total)+input.amount>Number(p.rows[0].amount)) throw new Error('REFUND_EXCEEDS_CAPTURED');
    const r=await tx.query<{id:string}>("insert into trust_refunds(payment_id,amount,reason,status,idempotency_key) values($1,$2,$3,'requested',$4) on conflict(idempotency_key) do nothing returning id",[input.paymentId,input.amount,input.reason??null,input.idempotencyKey]);
    if(!r.rows[0]){const prior=await tx.query<{id:string;payment_id:string;amount:number|string;status:string}>('select id,payment_id,amount,status from trust_refunds where idempotency_key=$1 for update',[input.idempotencyKey]);if(!prior.rows[0])throw new Error('REFUND_RETRY_REQUIRED');if(prior.rows[0].payment_id!==input.paymentId||Number(prior.rows[0].amount)!==input.amount)throw new Error('IDEMPOTENCY_KEY_REUSED');return {refundId:prior.rows[0].id,paymentId:prior.rows[0].payment_id,amount:Number(prior.rows[0].amount),status:prior.rows[0].status,replay:true};}
    const remaining=Number(p.rows[0].amount)-Number(already.rows[0].total)-input.amount;
    // A refund request is not financial settlement. Keep the payment captured until the provider confirms success.
    await tx.query('insert into trust_outbox_events(event_type,aggregate_id,payload_json) values(\'refund.requested\',$1,$2::jsonb)',[p.rows[0].order_id,JSON.stringify({refundId:r.rows[0].id,paymentId:input.paymentId,amount:input.amount})]);
    const paymentProvider=(await tx.query<{provider:string}>('select provider from trust_payments where id=$1',[input.paymentId])).rows[0]?.provider;
    if(!paymentProvider) throw new Error('PAYMENT_PROVIDER_NOT_FOUND');
    await tx.query(`insert into trust_payment_provider_jobs(kind,refund_id,provider,idempotency_key) values('REFUND',$1,$2,$3) on conflict(idempotency_key) do nothing`,[r.rows[0].id,paymentProvider,`refund:${input.idempotencyKey}`]);
    const result={refundId:r.rows[0].id,paymentId:input.paymentId,amount:input.amount,status:'requested'}; await saveIdempotency(tx,input.idempotencyKey,'refund.create',result,86400,expectedHash); return {...result,replay:false};
  });
}


export async function applyRefundEvent(db:SqlExecutor,input:{provider:string;eventId:string;refundId:string;status:'succeeded'|'failed';providerReference?:string;payload:unknown}){
  return db.transaction(async tx=>{
    const inserted=await tx.query<{id:string}>(`insert into trust_payment_events(provider,provider_event_id,payment_intent_id,status,payload_json)
      select $1,$2,p.payment_intent_id,case when $3='succeeded' then 'refunded' else 'failed' end,$4::jsonb
      from trust_refunds r join trust_payments p on p.id=r.payment_id where r.id=$5
      on conflict(provider,provider_event_id) do nothing returning id`,[input.provider,input.eventId,input.status,JSON.stringify(input.payload),input.refundId]);
    if(!inserted.rows[0]) return {ok:true,duplicate:true};
    const refund=await tx.query<{id:string;payment_id:string;amount:number|string;status:string;provider_reference:string|null}>('select id,payment_id,amount,status,provider_reference,return_id,dispute_case_id from trust_refunds where id=$1 for update',[input.refundId]);
    if(!refund.rows[0]) throw new Error('REFUND_NOT_FOUND');
    if(!['requested','processing'].includes(refund.rows[0].status)) return {ok:true,duplicate:false,ignored:true};
    const payment=await tx.query<{id:string;order_id:string;amount:number|string;status:PaymentStatus}>('select id,order_id,amount,status from trust_payments where id=$1 for update',[refund.rows[0].payment_id]);
    if(!payment.rows[0]) throw new Error('PAYMENT_NOT_FOUND');
    if(input.status==='failed'){
      if(refund.rows[0].dispute_case_id){
        await settleSellerDisputeRefundTx(tx,{refundId:input.refundId,status:'failed',providerReference:input.providerReference,eventId:input.eventId});
      } else {
        await tx.query(`update trust_refunds set status='failed',provider_reference=coalesce($2,provider_reference),updated_at=now() where id=$1`,[input.refundId,input.providerReference??null]);
      }
      await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('refund.failed',$1,$2::jsonb)`,[payment.rows[0].order_id,JSON.stringify({refundId:input.refundId,paymentId:payment.rows[0].id,disputeCaseId:refund.rows[0].dispute_case_id??null})]);
      return {ok:true,duplicate:false,refundId:input.refundId,status:'failed'};
    }
    if(refund.rows[0].dispute_case_id){
      await settleSellerDisputeRefundTx(tx,{refundId:input.refundId,status:'succeeded',providerReference:input.providerReference,eventId:input.eventId});
    } else {
      await tx.query(`update trust_refunds set status='succeeded',provider_reference=coalesce($2,provider_reference),updated_at=now() where id=$1`,[input.refundId,input.providerReference??null]);
      if(refund.rows[0].return_id){ await reverseSellerSettlementForReturnTx(tx,{paymentId:payment.rows[0].id,refundId:input.refundId,returnId:String(refund.rows[0].return_id)}); } else { await reverseSellerSettlementForRefundTx(tx,{paymentId:payment.rows[0].id,refundId:input.refundId,refundAmount:Number(refund.rows[0].amount)}); }
    }
    await recordPostSaleFinancialEventTx(tx,{eventType:'REFUND',amount:Number(refund.rows[0].amount),currency:payment.rows[0].currency,idempotencyKey:`payment-refund:${input.refundId}`,paymentId:payment.rows[0].id,refundId:input.refundId,metadata:{provider:input.provider,eventId:input.eventId,disputeCaseId:refund.rows[0].dispute_case_id??null}});await postRefundAccountingTx(tx,{refundId:input.refundId,orderId:payment.rows[0].order_id,amount:Number(refund.rows[0].amount),currency:payment.rows[0].currency});
    const totals=await tx.query<{total:string}>("select coalesce(sum(amount) filter(where status='succeeded'),0) total from trust_refunds where payment_id=$1",[payment.rows[0].id]);
    const next=Number(totals.rows[0].total)>=Number(payment.rows[0].amount)?'refunded':'partially_refunded';
    assertTransition(payment.rows[0].status,next);
    await tx.query('update trust_payments set status=$1,updated_at=now() where id=$2',[next,payment.rows[0].id]);
    if(next==='refunded'){
      await reversePromotionApplicationsTx(tx,{orderId:payment.rows[0].order_id,idempotencyKey:`refund:${input.refundId}`});
      const order=await tx.query<{status:string;customer_id:string|null}>("select status,customer_id from trust_orders where id=$1 for update",[payment.rows[0].order_id]);
      await tx.query("update trust_orders set status='refunded',updated_at=now() where id=$1",[payment.rows[0].order_id]);
      if(order.rows[0]?.status!=='refunded') await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,'refunded','refund_webhook','Refund fully confirmed')`,[payment.rows[0].order_id,order.rows[0]?.status??null]);
      if(order.rows[0]?.customer_id && order.rows[0]?.status!=='refunded') await queueOrderStatusNotificationsTx(tx,{orderId:payment.rows[0].order_id,customerId:order.rows[0].customer_id,status:'refunded'});
    }
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('refund.succeeded',$1,$2::jsonb)`,[payment.rows[0].order_id,JSON.stringify({refundId:input.refundId,paymentId:payment.rows[0].id,status:next})]);
    return {ok:true,duplicate:false,refundId:input.refundId,status:'succeeded',paymentStatus:next};
  });
}
