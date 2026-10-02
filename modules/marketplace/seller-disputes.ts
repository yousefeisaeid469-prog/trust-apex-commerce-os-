import type {PoolClient} from 'pg';
import {query, withPgTransaction} from '../platform/db/postgres';
import {appendPaymentLedgerTx} from './payment-ledger';

export type SellerDisputeKind='ITEM_NOT_RECEIVED'|'WRONG_ITEM'|'DAMAGED'|'NOT_AS_DESCRIBED'|'REFUND_MISSING'|'OTHER';
export type SellerDisputeStatus='OPEN'|'SELLER_RESPONSE_REQUIRED'|'UNDER_REVIEW'|'RESOLVED_CUSTOMER'|'RESOLVED_SELLER'|'CANCELLED';
const money=(n:number)=>Number(Number(n).toFixed(2));
function positive(n:number){if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_AMOUNT');}
const transitions:Record<SellerDisputeStatus,SellerDisputeStatus[]>={
  OPEN:['SELLER_RESPONSE_REQUIRED','CANCELLED'],
  SELLER_RESPONSE_REQUIRED:['UNDER_REVIEW','RESOLVED_SELLER','RESOLVED_CUSTOMER'],
  UNDER_REVIEW:['RESOLVED_SELLER','RESOLVED_CUSTOMER'],
  RESOLVED_CUSTOMER:[],RESOLVED_SELLER:[],CANCELLED:[]
};

async function holdSellerFundsTx(tx:PoolClient,merchantId:string,amount:number,currency:string,caseId:string,paymentId?:string,orderId?:string){
  const requested=money(amount); if(requested<=0)return 0;
  const bal=(await tx.query<any>('select available_balance from trust_marketplace_seller_balances where merchant_id=$1 for update',[merchantId])).rows[0];
  if(!bal)return 0;
  const held=Math.min(Number(bal.available_balance),requested);
  if(held<=0)return 0;
  await tx.query(`update trust_marketplace_seller_balances set available_balance=available_balance-$1,held_balance=held_balance+$1,updated_at=now() where merchant_id=$2`,[held,merchantId]);
  await appendPaymentLedgerTx(tx,{orderId,paymentId,merchantId,entryType:'HOLD',amount:held,direction:'DEBIT',currency,idempotencyKey:`seller-dispute-hold:${caseId}`});
  return money(held);
}

export async function openSellerDisputeTx(tx:PoolClient,input:{customerId:string;orderId:string;sellerOrderId:string;orderItemId?:string;kind:SellerDisputeKind;amount:number;currency:string;message?:string;idempotencyKey:string}){
  positive(input.amount);
  const replay=(await tx.query<any>('select id,status,requested_amount,held_amount from trust_seller_dispute_cases where idempotency_key=$1 for update',[input.idempotencyKey])).rows[0];
  if(replay)return {caseId:replay.id,status:replay.status,requestedAmount:Number(replay.requested_amount),heldAmount:Number(replay.held_amount),replay:true};
  const row=(await tx.query<any>(`select so.id seller_order_id,so.order_id,so.merchant_id,so.currency,o.customer_id,oi.id order_item_id,oi.quantity,oi.unit_price
    from trust_seller_orders so join trust_orders o on o.id=so.order_id left join trust_order_items oi on oi.id=$3 and oi.seller_order_id=so.id
    where so.id=$1 and so.order_id=$2 for update`,[input.sellerOrderId,input.orderId,input.orderItemId??null])).rows[0];
  if(!row)throw new Error('SELLER_ORDER_NOT_FOUND');
  if(String(row.customer_id)!==input.customerId)throw new Error('ORDER_NOT_OWNED');
  if(input.orderItemId && !row.order_item_id)throw new Error('ORDER_ITEM_NOT_IN_SELLER_ORDER');
  if(String(row.currency).toUpperCase()!==String(input.currency).toUpperCase())throw new Error('CURRENCY_MISMATCH');
  if(input.orderItemId && input.amount>money(Number(row.unit_price)*Number(row.quantity))+0.01)throw new Error('DISPUTE_AMOUNT_EXCEEDS_ITEM_VALUE');
  const r=(await tx.query<{id:string}>(`insert into trust_seller_dispute_cases(order_id,seller_order_id,order_item_id,merchant_id,customer_id,kind,status,requested_amount,currency,customer_message,idempotency_key)
    values($1,$2,$3,$4,$5,$6,'SELLER_RESPONSE_REQUIRED',$7,$8,$9,$10) returning id`,[input.orderId,input.sellerOrderId,input.orderItemId??null,row.merchant_id,input.customerId,input.kind,input.amount,String(input.currency).toUpperCase(),input.message??null,input.idempotencyKey])).rows[0];
  const held=await holdSellerFundsTx(tx,String(row.merchant_id),input.amount,String(input.currency).toUpperCase(),r.id);
  await tx.query(`update trust_seller_dispute_cases set held_amount=$2,updated_at=now() where id=$1`,[r.id,held]);
  await tx.query(`insert into trust_seller_dispute_events(case_id,from_status,to_status,actor_id,event_key,metadata_json) values($1,null,'SELLER_RESPONSE_REQUIRED',$2,$3,$4::jsonb)`,[r.id,input.customerId,`seller-dispute:${input.idempotencyKey}`,JSON.stringify({source:'customer',heldAmount:held})]);
  return {caseId:r.id,status:'SELLER_RESPONSE_REQUIRED',requestedAmount:input.amount,heldAmount:held,replay:false};
}

export async function listSellerDisputesForMerchant(merchantId:string,input?:{status?:string;limit?:number}){
  const limit=Math.min(Math.max(Number(input?.limit??50),1),200);
  return (await query<any>(`select d.id,d.order_id,d.seller_order_id,d.order_item_id,d.customer_id,d.kind,d.status,d.requested_amount,d.held_amount,d.currency,d.customer_message,d.seller_response,d.created_at,d.updated_at,d.resolved_at
    from trust_seller_dispute_cases d where d.merchant_id=$1 and ($2::text is null or d.status=$2) order by d.created_at desc limit $3`,[merchantId,input?.status??null,limit])).rows;
}

export async function listSellerDisputesForCustomer(customerId:string,input?:{status?:string;limit?:number}){
  const limit=Math.min(Math.max(Number(input?.limit??50),1),200);
  return (await query<any>(`select d.id,d.order_id,d.seller_order_id,d.order_item_id,d.merchant_id,mp.store_name seller_name,d.kind,d.status,d.requested_amount,d.held_amount,d.currency,d.customer_message,d.seller_response,d.resolution_note,d.created_at,d.updated_at,d.resolved_at
    from trust_seller_dispute_cases d join trust_merchant_profiles mp on mp.id=d.merchant_id where d.customer_id=$1 and ($2::text is null or d.status=$2) order by d.created_at desc limit $3`,[customerId,input?.status??null,limit])).rows;
}

export async function getSellerDisputeForActor(input:{caseId:string;customerId?:string;merchantId?:string}){
  const r=await query<any>(`select d.*,mp.store_name seller_name from trust_seller_dispute_cases d join trust_merchant_profiles mp on mp.id=d.merchant_id where d.id=$1 and ($2::uuid is null or d.customer_id=$2) and ($3::uuid is null or d.merchant_id=$3)`,[input.caseId,input.customerId??null,input.merchantId??null]);
  if(!r.rows[0])throw new Error('SELLER_DISPUTE_NOT_FOUND');
  const [evidence,events]=await Promise.all([
    query<any>('select id,submitted_by,actor_type,evidence_type,content_uri,content_text,metadata_json,created_at from trust_seller_dispute_evidence where case_id=$1 order by created_at asc',[input.caseId]),
    query<any>('select id,from_status,to_status,actor_id,event_key,metadata_json,created_at from trust_seller_dispute_events where case_id=$1 order by created_at asc',[input.caseId])
  ]);
  return {...r.rows[0],evidence:evidence.rows,events:events.rows};
}

export async function addSellerDisputeEvidenceTx(tx:PoolClient,input:{caseId:string;actorId:string;actorType:'CUSTOMER'|'SELLER'|'OPERATIONS';merchantId?:string;customerId?:string;evidenceType:'MESSAGE'|'IMAGE'|'DOCUMENT'|'TRACKING'|'REFUND_RECEIPT'|'OTHER';contentUri?:string;contentText?:string;metadata?:Record<string,unknown>}){
  if(!input.contentUri && !input.contentText)throw new Error('EVIDENCE_CONTENT_REQUIRED');
  const row=(await tx.query<any>('select id,merchant_id,customer_id,status from trust_seller_dispute_cases where id=$1 for update',[input.caseId])).rows[0];
  if(!row)throw new Error('SELLER_DISPUTE_NOT_FOUND');
  if(input.actorType==='SELLER' && row.merchant_id!==input.merchantId)throw new Error('SELLER_DISPUTE_NOT_OWNED');
  if(input.actorType==='CUSTOMER' && row.customer_id!==input.customerId)throw new Error('SELLER_DISPUTE_NOT_OWNED');
  if(['RESOLVED_CUSTOMER','RESOLVED_SELLER','CANCELLED'].includes(row.status))throw new Error('SELLER_DISPUTE_TERMINAL');
  const r=await tx.query<{id:string}>(`insert into trust_seller_dispute_evidence(case_id,submitted_by,actor_type,evidence_type,content_uri,content_text,metadata_json) values($1,$2,$3,$4,$5,$6,$7::jsonb) returning id`,[input.caseId,input.actorId,input.actorType,input.evidenceType,input.contentUri??null,input.contentText??null,JSON.stringify(input.metadata??{})]);
  return {evidenceId:r.rows[0].id};
}

export async function transitionSellerDisputeTx(tx:PoolClient,input:{caseId:string;to:SellerDisputeStatus;actorId:string;actorType:'CUSTOMER'|'SELLER'|'OPERATIONS';merchantId?:string;customerId?:string;note?:string;idempotencyKey:string}){
  const row=(await tx.query<any>('select * from trust_seller_dispute_cases where id=$1 for update',[input.caseId])).rows[0];
  if(!row)throw new Error('SELLER_DISPUTE_NOT_FOUND');
  if(input.actorType==='SELLER' && row.merchant_id!==input.merchantId)throw new Error('SELLER_DISPUTE_NOT_OWNED');
  if(input.actorType==='CUSTOMER' && row.customer_id!==input.customerId)throw new Error('SELLER_DISPUTE_NOT_OWNED');
  const from=String(row.status) as SellerDisputeStatus;
  if(from===input.to)return {caseId:row.id,from,to:from,replay:true};
  if(!transitions[from]?.includes(input.to))throw new Error('INVALID_SELLER_DISPUTE_TRANSITION');
  if(input.actorType==='SELLER' && !['UNDER_REVIEW','RESOLVED_SELLER','RESOLVED_CUSTOMER'].includes(input.to))throw new Error('SELLER_CANNOT_SET_STATUS');
  if(input.actorType==='CUSTOMER' && !['CANCELLED'].includes(input.to))throw new Error('CUSTOMER_CANNOT_SET_STATUS');
  const held=money(Number(row.held_amount));
  if(input.to==='RESOLVED_CUSTOMER' && held>0){
    const bal=(await tx.query<any>('select held_balance from trust_marketplace_seller_balances where merchant_id=$1 for update',[row.merchant_id])).rows[0];
    if(!bal || Number(bal.held_balance)+0.01<held)throw new Error('SELLER_HOLD_BALANCE_INSUFFICIENT');
    // Keep the reserve held until the payment provider confirms the refund.
    // V347's refund webhook is the only path that consumes this reserve.
  } else if((input.to==='RESOLVED_SELLER'||input.to==='CANCELLED') && held>0){
    const bal=(await tx.query<any>('select held_balance from trust_marketplace_seller_balances where merchant_id=$1 for update',[row.merchant_id])).rows[0];
    if(!bal || Number(bal.held_balance)+0.01<held)throw new Error('SELLER_HOLD_BALANCE_INSUFFICIENT');
    await tx.query(`update trust_marketplace_seller_balances set held_balance=held_balance-$1,available_balance=available_balance+$1,updated_at=now() where merchant_id=$2`,[held,row.merchant_id]);
    await appendPaymentLedgerTx(tx,{orderId:row.order_id,merchantId:row.merchant_id,entryType:'RELEASE',amount:held,direction:'CREDIT',currency:row.currency,idempotencyKey:`seller-dispute-release:${row.id}`});
  }
  let refundId: string|undefined;
  if(input.to==='RESOLVED_CUSTOMER' && held>0){
    const payment=(await tx.query<any>(`select p.id,p.provider,p.currency,p.status,p.amount from trust_payments p where p.order_id=$1 and p.status in ('captured','partially_refunded') order by p.created_at desc limit 1 for update`,[row.order_id])).rows[0];
    if(!payment) throw new Error('CAPTURED_PAYMENT_NOT_FOUND');
    const existing=(await tx.query<any>('select id,status,amount from trust_refunds where dispute_case_id=$1 for update',[row.id])).rows[0];
    if(existing){
      refundId=String(existing.id);
    } else {
      const already=Number((await tx.query<any>(`select coalesce(sum(amount),0) total from trust_refunds where payment_id=$1 and status in ('requested','processing','succeeded')`,[payment.id])).rows[0].total);
      if(already+held>Number(payment.amount)+0.01) throw new Error('REFUND_EXCEEDS_CAPTURED');
      const created=(await tx.query<any>(`insert into trust_refunds(payment_id,amount,reason,status,idempotency_key,dispute_case_id) values($1,$2,$3,'requested',$4,$5) returning id`,[payment.id,held,`dispute:${row.id}`,`dispute-refund:${row.id}`,row.id])).rows[0];
      refundId=String(created.id);
      await tx.query(`insert into trust_payment_provider_jobs(kind,refund_id,provider,idempotency_key) values('REFUND',$1,$2,$3) on conflict(idempotency_key) do nothing`,[refundId,payment.provider,`refund:dispute:${row.id}`]);
      await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('dispute.refund.requested',$1,$2::jsonb)`,[row.id,JSON.stringify({caseId:row.id,refundId,orderId:row.order_id,merchantId:row.merchant_id,amount:held,currency:row.currency})]);
    }
    await tx.query(`update trust_seller_dispute_cases set refund_id=$2,refund_status='REQUESTED',updated_at=now() where id=$1`,[row.id,refundId]);
  }
  await tx.query(`update trust_seller_dispute_cases set status=$2,seller_response=case when $3='SELLER' then coalesce($4,seller_response) else seller_response end,resolution_note=case when $3='OPERATIONS' then coalesce($4,resolution_note) else resolution_note end,resolved_at=case when $2 in ('RESOLVED_CUSTOMER','RESOLVED_SELLER','CANCELLED') then now() else resolved_at end,updated_at=now() where id=$1`,[row.id,input.to,input.actorType,input.note??null]);
  await tx.query(`insert into trust_seller_dispute_events(case_id,from_status,to_status,actor_id,event_key,metadata_json) values($1,$2,$3,$4,$5,$6::jsonb)`,[row.id,from,input.to,input.actorId,`transition:${input.idempotencyKey}`,JSON.stringify({actorType:input.actorType,heldAmount:held,note:input.note??null,refundId:refundId??null})]);
  return {caseId:row.id,from,to:input.to,replay:false,refundId};
}

export async function settleSellerDisputeRefundTx(tx:PoolClient,input:{refundId:string;status:'succeeded'|'failed';providerReference?:string;eventId:string}){
  const row=(await tx.query<any>(`select r.id,r.payment_id,r.amount,r.status,r.dispute_case_id,d.order_id,d.merchant_id,d.held_amount,d.currency,d.status dispute_status
    from trust_refunds r join trust_seller_dispute_cases d on d.id=r.dispute_case_id
    where r.id=$1 for update`,[input.refundId])).rows[0];
  if(!row)throw new Error('DISPUTE_REFUND_NOT_FOUND');
  if(!['requested','processing'].includes(String(row.status)))return {ok:true,ignored:true,status:row.status};
  const amount=money(Number(row.amount));
  const held=money(Number(row.held_amount));
  const bal=(await tx.query<any>('select held_balance,available_balance from trust_marketplace_seller_balances where merchant_id=$1 for update',[row.merchant_id])).rows[0];
  if(!bal)throw new Error('SELLER_BALANCE_NOT_FOUND');
  if(input.status==='failed'){
    if(held>0){
      if(Number(bal.held_balance)+0.01<held)throw new Error('SELLER_HOLD_BALANCE_INSUFFICIENT');
      await tx.query(`update trust_marketplace_seller_balances set held_balance=held_balance-$1,available_balance=available_balance+$1,updated_at=now() where merchant_id=$2`,[held,row.merchant_id]);
      await appendPaymentLedgerTx(tx,{orderId:row.order_id,merchantId:row.merchant_id,entryType:'RELEASE',amount:held,direction:'CREDIT',currency:row.currency,idempotencyKey:`seller-dispute-refund-failed-release:${row.id}`});
    }
    await tx.query(`update trust_refunds set status='failed',provider_reference=coalesce($2,provider_reference),updated_at=now() where id=$1`,[row.id,input.providerReference??null]);
    await tx.query(`update trust_seller_dispute_cases set refund_status='FAILED',held_amount=0,updated_at=now() where id=$1`,[row.dispute_case_id]);
    return {ok:true,status:'failed',refundId:row.id};
  }
  if(held+0.01<amount)throw new Error('DISPUTE_HOLD_BELOW_REFUND');
  if(Number(bal.held_balance)+0.01<amount)throw new Error('SELLER_HOLD_BALANCE_INSUFFICIENT');
  await tx.query(`update trust_marketplace_seller_balances set held_balance=held_balance-$1,updated_at=now() where merchant_id=$2`,[amount,row.merchant_id]);
  await appendPaymentLedgerTx(tx,{orderId:row.order_id,merchantId:row.merchant_id,entryType:'CHARGEBACK',amount,direction:'DEBIT',currency:row.currency,idempotencyKey:`seller-dispute-chargeback:${row.id}`});
  await tx.query(`update trust_seller_order_financials set refunded_amount=least(seller_credit_amount,refunded_amount+$1),released_amount=greatest(0,released_amount-$1),status=case when $1>=seller_credit_amount then 'RELEASED' else 'PAYOUT_HELD' end,updated_at=now() where seller_order_id=(select seller_order_id from trust_seller_dispute_cases where id=$2)`,[amount,row.dispute_case_id]);
  await tx.query(`update trust_refunds set status='succeeded',provider_reference=coalesce($2,provider_reference),updated_at=now() where id=$1`,[row.id,input.providerReference??null]);
  await tx.query(`update trust_seller_dispute_cases set refund_status='SUCCEEDED',refunded_amount=$2,held_amount=0,updated_at=now() where id=$1`,[row.dispute_case_id,amount]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('dispute.refund.succeeded',$1,$2::jsonb)`,[row.dispute_case_id,JSON.stringify({caseId:row.dispute_case_id,refundId:row.id,amount,currency:row.currency,eventId:input.eventId})]);
  return {ok:true,status:'succeeded',refundId:row.id,amount};
}


export async function openSellerDispute(input:{customerId:string;orderId:string;sellerOrderId:string;orderItemId?:string;kind:SellerDisputeKind;amount:number;currency:string;message?:string;idempotencyKey:string}){
  return withPgTransaction(tx=>openSellerDisputeTx(tx,input));
}
