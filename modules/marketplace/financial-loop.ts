import type {PoolClient} from 'pg';
import type {SqlExecutor} from '../platform/persistence/postgres-boundary';
import {appendPaymentLedgerTx} from './payment-ledger';

const money=(n:number)=>Number(Number(n).toFixed(2));
function positive(n:number){if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_AMOUNT');}


export type PayoutEligibility = {
  snapshotId:string;
  merchantId:string;
  currency:string;
  availableBalance:number;
  pendingBalance:number;
  heldBalance:number;
  releasedOrderEligible:number;
  pendingSellerOrders:number;
  disputeHold:number;
  returnExposure:number;
  refundProviderExposure:number;
  existingPayoutHold:number;
  eligibleAmount:number;
  decision:'ELIGIBLE'|'PARTIAL'|'BLOCKED';
  reason:string;
};

const payoutEligibleStatuses = `('REQUESTED','PROCESSING','HELD','PAID')`;

export async function calculatePayoutEligibilityTx(tx:PoolClient,input:{merchantId:string;currency?:string;requestedAmount?:number;idempotencyKey?:string}):Promise<PayoutEligibility>{
  const balance=await tx.query<any>(`select merchant_id,available_balance,pending_balance,held_balance,currency from trust_marketplace_seller_balances where merchant_id=$1 for update`,[input.merchantId]);
  if(!balance.rows[0])throw new Error('SELLER_BALANCE_NOT_FOUND');
  const b=balance.rows[0];
  const currency=String(b.currency);
  if(input.currency && input.currency!==currency)throw new Error('PAYOUT_CURRENCY_MISMATCH');
  const requested=input.requestedAmount==null?null:money(input.requestedAmount);
  if(requested!==null && requested<=0)throw new Error('INVALID_AMOUNT');

  const orders=await tx.query<any>(`select
      coalesce(sum(greatest(sf.released_amount-sf.refunded_amount,0)),0)::numeric released_order_eligible,
      coalesce(sum(greatest(sf.seller_credit_amount-sf.released_amount,0)),0)::numeric pending_seller_orders
    from trust_seller_order_financials sf
    where sf.merchant_id=$1`,[input.merchantId]);
  const allocated=await tx.query<any>(`select coalesce(sum(x.amount),0)::numeric amount from (
      select a.amount from trust_marketplace_payout_eligibility_allocations a join trust_marketplace_payout_requests p on p.id=a.payout_id where a.merchant_id=$1 and p.status in ${payoutEligibleStatuses}
      union all
      select a.amount from trust_seller_order_payout_allocations a join trust_marketplace_payout_requests p on p.id=a.payout_id where a.merchant_id=$1 and p.status in ${payoutEligibleStatuses}
    ) x`,[input.merchantId]);
  const existingPayout=await tx.query<any>(`select coalesce(sum(amount),0)::numeric amount
    from trust_marketplace_payout_requests where merchant_id=$1 and status in ('REQUESTED','PROCESSING','HELD')`,[input.merchantId]);
  const dispute=await tx.query<any>(`select coalesce(sum(held_amount),0)::numeric amount
    from trust_seller_dispute_cases where merchant_id=$1 and held_amount>0 and refund_status in ('REQUESTED','PROCESSING','NOT_REQUESTED')`,[input.merchantId]);
  const returns=await tx.query<any>(`select coalesce(sum(greatest(x.gross_amount-x.refunded_amount,0)),0)::numeric amount
    from (
      select ri.return_id,so.merchant_id,
        sum(ri.quantity*oi.unit_price)::numeric gross_amount,
        coalesce((select sum(a.amount) from trust_seller_return_refund_allocations a join trust_refunds rf on rf.id=a.refund_id where a.return_id=ri.return_id and a.seller_order_id=ri.seller_order_id and rf.status in ('requested','processing','succeeded')),0)::numeric refunded_amount
      from trust_return_items ri
      join trust_order_items oi on oi.id=ri.order_item_id
      join trust_seller_orders so on so.id=ri.seller_order_id
      join trust_returns r on r.id=ri.return_id
      where so.merchant_id=$1 and r.status in ('REQUESTED','APPROVED','RECEIVED','INSPECTING','APPROVED_REFUND','REFUND_PENDING')
      group by ri.return_id,ri.seller_order_id,so.merchant_id
    ) x`,[input.merchantId]);
  const refunds=await tx.query<any>(`select coalesce(sum(rf.amount),0)::numeric amount
    from trust_refunds rf
    join trust_payments p on p.id=rf.payment_id
    where rf.status in ('requested','processing')
      and exists (select 1 from trust_marketplace_payment_ledger l where l.payment_id=p.id and l.merchant_id=$1 and l.entry_type='SELLER_CREDIT' and l.direction='CREDIT')`,[input.merchantId]);

  const releasedOrderEligible=money(Math.max(0,Number(orders.rows[0]?.released_order_eligible||0)-Number(allocated.rows[0]?.amount||0)));
  const availableBalance=money(Number(b.available_balance));
  const eligibleAmount=money(Math.min(availableBalance,releasedOrderEligible));
  let decision:'ELIGIBLE'|'PARTIAL'|'BLOCKED'='BLOCKED';
  let reason='NO_RELEASED_SELLER_FUNDS';
  if(eligibleAmount>0 && requested===null) { decision='ELIGIBLE'; reason='RELEASED_SELLER_FUNDS'; }
  else if(requested!==null && requested>0 && eligibleAmount>=requested) { decision='ELIGIBLE'; reason='RELEASED_SELLER_FUNDS'; }
  else if(eligibleAmount>0) { decision='PARTIAL'; reason='PAYOUT_EXCEEDS_ELIGIBLE_BALANCE'; }
  else if(availableBalance<=0) { reason='NO_AVAILABLE_BALANCE'; }

  const key=input.idempotencyKey??`eligibility:${input.merchantId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const snapshot=await tx.query<any>(`insert into trust_marketplace_payout_eligibility_snapshots
    (merchant_id,currency,available_balance,pending_balance,held_balance,released_order_eligible,pending_seller_orders,dispute_hold,return_exposure,refund_provider_exposure,existing_payout_hold,eligible_amount,requested_amount,decision,reason,idempotency_key)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id`,[
      input.merchantId,currency,availableBalance,Number(b.pending_balance),Number(b.held_balance),eligibleAmount,
      money(Number(orders.rows[0]?.pending_seller_orders||0)),money(Number(dispute.rows[0]?.amount||0)),money(Number(returns.rows[0]?.amount||0)),
      money(Number(refunds.rows[0]?.amount||0)),money(Number(existingPayout.rows[0]?.amount||0)),eligibleAmount,requested,decision,reason,key]);
  return {snapshotId:String(snapshot.rows[0].id),merchantId:input.merchantId,currency,availableBalance,pendingBalance:money(Number(b.pending_balance)),heldBalance:money(Number(b.held_balance)),releasedOrderEligible, pendingSellerOrders:money(Number(orders.rows[0]?.pending_seller_orders||0)),disputeHold:money(Number(dispute.rows[0]?.amount||0)),returnExposure:money(Number(returns.rows[0]?.amount||0)),refundProviderExposure:money(Number(refunds.rows[0]?.amount||0)),existingPayoutHold:money(Number(existingPayout.rows[0]?.amount||0)),eligibleAmount,decision,reason};
}

export async function releaseDeliveredSettlementTx(tx:PoolClient,input:{orderId:string;idempotencyKey:string}){
  const order=await tx.query<{status:string}>('select status from trust_orders where id=$1 for update',[input.orderId]);
  if(!order.rows[0])throw new Error('ORDER_NOT_FOUND');
  if(order.rows[0].status!=='delivered')throw new Error('ORDER_NOT_DELIVERED');
  const settlement=await tx.query<any>(`select * from trust_marketplace_payment_settlements where order_id=$1 for update`,[input.orderId]);
  if(!settlement.rows[0])return {released:false,reason:'NO_SETTLEMENT'};
  const s=settlement.rows[0];
  if(s.status==='REVERSED')throw new Error('SETTLEMENT_REVERSED');
  if(s.status==='RELEASED')return {released:false,replay:true,amount:Number(s.seller_net)};
  const credits=await tx.query<{merchant_id:string;amount:string}>(`select merchant_id,sum(amount)::numeric amount from trust_marketplace_payment_ledger where payment_id=(select payment_id from trust_marketplace_payment_settlements where id=$1) and entry_type='SELLER_CREDIT' and direction='CREDIT' group by merchant_id`,[s.id]);
  for(const c of credits.rows){
    const amount=money(Number(c.amount));
    if(amount<=0)continue;
    const inserted=await tx.query<{id:string}>(`insert into trust_marketplace_balance_releases(merchant_id,order_id,settlement_id,amount,currency,idempotency_key) values($1,$2,$3,$4,$5,$6) on conflict(idempotency_key) do nothing returning id`,[c.merchant_id,input.orderId,s.id,amount,s.currency,`${input.idempotencyKey}:release:${c.merchant_id}`]);
    if(!inserted.rows[0])continue;
    await tx.query(`update trust_marketplace_seller_balances set pending_balance=greatest(0,pending_balance-$1),available_balance=available_balance+$1,updated_at=now() where merchant_id=$2`,[amount,c.merchant_id]);
    await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:s.payment_id,merchantId:c.merchant_id,entryType:'RELEASE',amount,direction:'CREDIT',currency:s.currency,idempotencyKey:`${input.idempotencyKey}:ledger:${c.merchant_id}`});
    await tx.query(`update trust_seller_order_financials set settlement_id=$1,payment_id=$2,released_amount=least(seller_credit_amount,$3),currency=$4,status=case when status='PAID' then 'PAID' else 'RELEASED' end,updated_at=now() where seller_order_id=(select id from trust_seller_orders where order_id=$5 and merchant_id=$6)`,[s.id,s.payment_id,amount,s.currency,input.orderId,c.merchant_id]);
  }
  await tx.query(`update trust_marketplace_payment_settlements set status='RELEASED',delivered_at=now(),released_at=now(),updated_at=now() where id=$1`,[s.id]);
  await tx.query(`insert into trust_seller_order_financials(seller_order_id,merchant_id,settlement_id,payment_id,gross_amount,seller_credit_amount,released_amount,currency,status)
    select so.id,so.merchant_id,s.id,s.payment_id,so.subtotal,c.amount,c.amount,s.currency,'RELEASED'
    from trust_seller_orders so
    join (select merchant_id,sum(amount)::numeric amount from trust_marketplace_payment_ledger where payment_id=$1 and entry_type='SELLER_CREDIT' and direction='CREDIT' group by merchant_id) c on c.merchant_id=so.merchant_id
    where so.order_id=$2
    on conflict(seller_order_id) do update set settlement_id=excluded.settlement_id,payment_id=excluded.payment_id,seller_credit_amount=excluded.seller_credit_amount,released_amount=excluded.released_amount,currency=excluded.currency,status=case when trust_seller_order_financials.status='PAID' then 'PAID' else 'RELEASED' end,updated_at=now()`,[s.payment_id,input.orderId]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.seller_balance.released',$1,$2::jsonb)`,[input.orderId,JSON.stringify({orderId:input.orderId,settlementId:s.id,amount:Number(s.seller_net)})]);
  return {released:true,replay:false,amount:Number(s.seller_net),settlementId:s.id};
}

export async function requestPayoutTx(tx:PoolClient,input:{merchantId:string;amount:number;currency?:string;provider?:string;idempotencyKey:string}){
  positive(input.amount);
  const requestedCurrency=input.currency?.trim();
  const existing=await tx.query<any>('select * from trust_marketplace_payout_requests where idempotency_key=$1 for update',[input.idempotencyKey]);
  if(existing.rows[0])return {payoutId:existing.rows[0].id,status:existing.rows[0].status,amount:Number(existing.rows[0].amount),replay:true};
  const eligibility=await calculatePayoutEligibilityTx(tx,{merchantId:input.merchantId,currency:requestedCurrency,requestedAmount:input.amount,idempotencyKey:`${input.idempotencyKey}:eligibility`});
  const payoutCurrency=eligibility.currency;
  if(eligibility.availableBalance<money(input.amount))throw new Error('INSUFFICIENT_AVAILABLE_BALANCE');
  if(eligibility.eligibleAmount<money(input.amount))throw new Error(eligibility.decision==='BLOCKED'?'PAYOUT_NOT_ELIGIBLE':'INSUFFICIENT_PAYOUT_ELIGIBILITY');
  const r=await tx.query<{id:string}>(`insert into trust_marketplace_payout_requests(merchant_id,amount,currency,status,provider,idempotency_key,eligibility_snapshot_id) values($1,$2,$3,'REQUESTED',$4,$5,$6) returning id`,[input.merchantId,input.amount,payoutCurrency,input.provider??null,input.idempotencyKey,eligibility.snapshotId]);
  await tx.query(`insert into trust_marketplace_payout_eligibility_holds(snapshot_id,payout_id,merchant_id,amount,currency,status,reason) values($1,$2,$3,$4,$5,'ACTIVE','PAYOUT_ELIGIBILITY')`,[eligibility.snapshotId,r.rows[0].id,input.merchantId,input.amount,payoutCurrency]);
  const orderAllocations=await tx.query<any>(`select sf.seller_order_id,greatest(sf.released_amount-sf.refunded_amount,0)::numeric eligible
    from trust_seller_order_financials sf where sf.merchant_id=$1 and greatest(sf.released_amount-sf.refunded_amount,0)>0 order by sf.updated_at,sf.seller_order_id for update`,[input.merchantId]);
  let remaining=money(input.amount);
  for(const row of orderAllocations.rows){
    if(remaining<=0)break;
    const already=await tx.query<any>(`select coalesce(sum(x.amount),0)::numeric amount from (
      select a.amount from trust_marketplace_payout_eligibility_allocations a join trust_marketplace_payout_requests p on p.id=a.payout_id where a.seller_order_id=$1 and p.status in ${payoutEligibleStatuses}
      union all
      select a.amount from trust_seller_order_payout_allocations a join trust_marketplace_payout_requests p on p.id=a.payout_id where a.seller_order_id=$1 and p.status in ${payoutEligibleStatuses}
    ) x`,[row.seller_order_id]);
    const capacity=money(Math.max(0,Number(row.eligible)-Number(already.rows[0]?.amount||0)));
    const amount=money(Math.min(remaining,capacity)); if(amount<=0)continue;
    await tx.query(`insert into trust_marketplace_payout_eligibility_allocations(snapshot_id,payout_id,seller_order_id,merchant_id,amount,currency,reason) values($1,$2,$3,$4,$5,$6,'RELEASED_SELLER_ORDER')`,[eligibility.snapshotId,r.rows[0].id,row.seller_order_id,input.merchantId,amount,payoutCurrency]);
    remaining=money(remaining-amount);
  }
  if(remaining>0) await tx.query(`insert into trust_marketplace_payout_eligibility_allocations(snapshot_id,payout_id,seller_order_id,merchant_id,amount,currency,reason) values($1,$2,null,$3,$4,$5,'NON_ORDER_AVAILABLE')`,[eligibility.snapshotId,r.rows[0].id,input.merchantId,remaining,payoutCurrency]);
  await tx.query(`update trust_marketplace_seller_balances set available_balance=available_balance-$1,held_balance=held_balance+$1,updated_at=now() where merchant_id=$2`,[input.amount,input.merchantId]);
  await appendPaymentLedgerTx(tx,{merchantId:input.merchantId,entryType:'HOLD',amount:input.amount,direction:'DEBIT',currency:payoutCurrency,idempotencyKey:`payout:${input.idempotencyKey}:hold`});
  let providerJobId:string|null=null;
  if(input.provider){
    const job=await tx.query<{id:string}>(`insert into trust_payment_provider_jobs(kind,payout_id,provider,idempotency_key) values('PAYOUT',$1,$2,$3) on conflict(idempotency_key) do update set updated_at=now() returning id`,[r.rows[0].id,input.provider,`payout:${input.idempotencyKey}`]);
    providerJobId=job.rows[0]?.id??null;
    if(providerJobId) await tx.query(`update trust_marketplace_payout_requests set provider_job_id=$2,updated_at=now() where id=$1`,[r.rows[0].id,providerJobId]);
  }
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.payout.requested',$1,$2::jsonb)`,[input.merchantId,JSON.stringify({payoutId:r.rows[0].id,merchantId:input.merchantId,amount:input.amount,provider:input.provider??null,providerJobId})]);
  return {payoutId:r.rows[0].id,status:'REQUESTED',amount:input.amount,replay:false,eligibilitySnapshotId:eligibility.snapshotId,eligibleAmount:eligibility.eligibleAmount,providerJobId};
}

export async function applyPayoutProviderWebhookTx(tx:PoolClient,input:{payoutId:string;provider:string;providerEventId:string;status:'PROCESSING'|'PAID'|'FAILED'|'HELD'|'REVERSED';providerReference?:string;amount:number;currency:string;failureCode?:string;payload?:unknown;idempotencyKey:string}){
  positive(input.amount);
  const payout=await tx.query<any>('select * from trust_marketplace_payout_requests where id=$1 for update',[input.payoutId]);
  if(!payout.rows[0])throw new Error('PAYOUT_NOT_FOUND');
  const p=payout.rows[0];
  if(String(p.provider||'')!==input.provider)throw new Error('PAYOUT_PROVIDER_MISMATCH');
  if(String(p.currency)!==String(input.currency))throw new Error('PAYOUT_CURRENCY_MISMATCH');
  if(money(Number(p.amount))!==money(input.amount))throw new Error('PAYOUT_AMOUNT_MISMATCH');
  if(input.providerReference && p.provider_reference && String(p.provider_reference)!==input.providerReference)throw new Error('PAYOUT_PROVIDER_REFERENCE_CONFLICT');
  const existing=await tx.query<any>('select id,status,amount,currency,payout_id from trust_marketplace_payout_provider_events where provider=$1 and provider_event_id=$2 for update',[input.provider,input.providerEventId]);
  if(existing.rows[0]){
    if(String(existing.rows[0].payout_id)!==input.payoutId || money(Number(existing.rows[0].amount))!==money(input.amount) || String(existing.rows[0].currency)!==String(input.currency) || String(existing.rows[0].status)!==input.status)throw new Error('PAYOUT_PROVIDER_EVENT_PAYLOAD_CONFLICT');
    return {payoutId:input.payoutId,eventId:String(existing.rows[0].id),status:existing.rows[0].status,replay:true};
  }
  const event=await tx.query<{id:string}>(`insert into trust_marketplace_payout_provider_events(payout_id,provider,provider_event_id,provider_reference,status,amount,currency,failure_code,payload_json,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) returning id`,[input.payoutId,input.provider,input.providerEventId,input.providerReference??null,input.status,money(input.amount),input.currency,input.failureCode??null,JSON.stringify(input.payload??{}),input.idempotencyKey]);
  const result=await applyPayoutEventTx(tx,{payoutId:input.payoutId,status:input.status,providerReference:input.providerReference,failureCode:input.failureCode});
  await tx.query(`update trust_marketplace_payout_provider_events set processed_at=now() where id=$1`,[event.rows[0].id]);
  await tx.query(`update trust_marketplace_payout_requests set provider_event_id=$2,updated_at=now() where id=$1`,[input.payoutId,input.providerEventId]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.payout.provider_webhook_processed',$1,$2::jsonb)`,[input.payoutId,JSON.stringify({payoutId:input.payoutId,provider:input.provider,providerEventId:input.providerEventId,status:input.status,amount:money(input.amount),currency:input.currency})]);
  return {payoutId:input.payoutId,eventId:event.rows[0].id,status:result.status,replay:false};
}

export async function applyPayoutEventTx(tx:PoolClient,input:{payoutId:string;status:'PROCESSING'|'PAID'|'FAILED'|'HELD'|'REVERSED';providerReference?:string;failureCode?:string}){
  const payout=await tx.query<any>('select * from trust_marketplace_payout_requests where id=$1 for update',[input.payoutId]);
  if(!payout.rows[0])throw new Error('PAYOUT_NOT_FOUND');
  const p=payout.rows[0];
  if(p.status===input.status&&(!input.providerReference||p.provider_reference===input.providerReference))return {payoutId:p.id,status:p.status,replay:true};
  if(['PAID','REVERSED'].includes(p.status))throw new Error(`PAYOUT_TERMINAL:${p.status}`);
  await tx.query(`update trust_marketplace_payout_requests set status=$2,provider_reference=coalesce($3,provider_reference),failure_code=coalesce($4,failure_code),processed_at=case when $2 in ('PAID','FAILED','REVERSED') then now() else processed_at end,updated_at=now() where id=$1`,[p.id,input.status,input.providerReference??null,input.failureCode??null]);
  if(input.status==='PAID'){
    await tx.query(`update trust_marketplace_payout_eligibility_holds set status='CONSUMED',released_at=now() where payout_id=$1 and status='ACTIVE'`,[p.id]);
    await tx.query(`update trust_marketplace_seller_balances set held_balance=greatest(0,held_balance-$1),updated_at=now() where merchant_id=$2`,[p.amount,p.merchant_id]);
    await appendPaymentLedgerTx(tx,{merchantId:p.merchant_id,entryType:'PAYOUT',amount:Number(p.amount),direction:'DEBIT',currency:p.currency,idempotencyKey:`payout:${p.id}:paid`,metadata:{payoutId:p.id,source:'payout_provider_event'}});
  } else if(['FAILED','REVERSED'].includes(input.status)){
    await tx.query(`update trust_marketplace_payout_eligibility_holds set status='RELEASED',released_at=now() where payout_id=$1 and status='ACTIVE'`,[p.id]);
    await tx.query(`update trust_marketplace_seller_balances set held_balance=greatest(0,held_balance-$1),available_balance=available_balance+$1,updated_at=now() where merchant_id=$2`,[p.amount,p.merchant_id]);
    await appendPaymentLedgerTx(tx,{merchantId:p.merchant_id,entryType:'PAYOUT_REVERSAL',amount:Number(p.amount),direction:'CREDIT',currency:p.currency,idempotencyKey:`payout:${p.id}:reversal`});
  }
  return {payoutId:p.id,status:input.status,replay:false};
}

export async function reverseSellerSettlementForRefundTx(tx:PoolClient,input:{paymentId:string;refundId:string;refundAmount:number}){
  positive(input.refundAmount);
  const settlement=await tx.query<any>('select * from trust_marketplace_payment_settlements where payment_id=$1 for update',[input.paymentId]);
  if(!settlement.rows[0])return {reversed:0,replay:false};
  const s=settlement.rows[0];
  const merchandiseGross=Number(s.merchandise_gross ?? (Number(s.seller_net)+Number(s.platform_fee)+Number(s.payment_fee)+Number(s.fulfillment_fee)+Number(s.return_fee))); const ratio=Math.min(1,input.refundAmount/Math.max(merchandiseGross,0.01));
  const credits=await tx.query<{merchant_id:string;amount:string}>(`select merchant_id,sum(amount)::numeric amount from trust_marketplace_payment_ledger where payment_id=$1 and entry_type='SELLER_CREDIT' and direction='CREDIT' group by merchant_id`,[input.paymentId]);
  let reversed=0;
  for(const c of credits.rows){
    const target=money(Number(c.amount)*ratio);
    if(target<=0)continue;
    const prior=await tx.query<{amount:string}>("select coalesce(sum(amount),0)::numeric amount from trust_marketplace_payment_ledger where payment_id=$1 and merchant_id=$2 and entry_type='REFUND' and idempotency_key like $3",[input.paymentId,c.merchant_id,`refund-reversal:${input.refundId}:%`]);
    if(Number(prior.rows[0]?.amount||0)>0)continue;
    const bal=await tx.query<{pending_balance:string;available_balance:string;held_balance:string}>(`select pending_balance,available_balance,held_balance from trust_marketplace_seller_balances where merchant_id=$1 for update`,[c.merchant_id]);
    if(!bal.rows[0])continue;
    const pending=Math.min(Number(bal.rows[0].pending_balance),target);
    const available=Math.min(Number(bal.rows[0].available_balance),money(target-pending));
    const deficit=money(target-pending-available);
    await tx.query(`update trust_marketplace_seller_balances set available_balance=greatest(0,available_balance-$1),pending_balance=greatest(0,pending_balance-$2),held_balance=held_balance+$3,updated_at=now() where merchant_id=$4`,[available,pending,deficit,c.merchant_id]);
    await appendPaymentLedgerTx(tx,{paymentId:input.paymentId,merchantId:c.merchant_id,entryType:'REFUND',amount:target,direction:'DEBIT',currency:s.currency,idempotencyKey:`refund-reversal:${input.refundId}:${c.merchant_id}`,metadata:{refundId:input.refundId,source:'seller-settlement-reversal'}});
    // Reverse the platform's proportional monetization for the refunded seller value.
    const sellerRatio = Number(c.amount) > 0 ? Math.min(1, target / Number(c.amount)) : 0;
    const platformFee = money(Number(s.platform_fee) * sellerRatio);
    const paymentFee = money(Number(s.payment_fee) * sellerRatio);
    const fulfillmentFee = money(Number(s.fulfillment_fee) * sellerRatio);
    if(platformFee>0) await tx.query(`insert into trust_revenue_ledger(order_id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,'COMMISSION','REFUND',$3,$4,'REFUND',$5,$6,$7::jsonb) on conflict(idempotency_key) do nothing`,[s.order_id,c.merchant_id,platformFee,s.currency,input.refundId,`revenue-refund:${input.refundId}:${c.merchant_id}:commission`,JSON.stringify({source:'seller-settlement-reversal'})]);
    if(paymentFee>0) await tx.query(`insert into trust_revenue_ledger(order_id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,'PAYMENT_FEES','REFUND',$3,$4,'REFUND',$5,$6,$7::jsonb) on conflict(idempotency_key) do nothing`,[s.order_id,c.merchant_id,paymentFee,s.currency,input.refundId,`revenue-refund:${input.refundId}:${c.merchant_id}:payment-fee`,JSON.stringify({source:'seller-settlement-reversal'})]);
    if(fulfillmentFee>0) await tx.query(`insert into trust_revenue_ledger(order_id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,'FULFILLMENT','REFUND',$3,$4,'REFUND',$5,$6,$7::jsonb) on conflict(idempotency_key) do nothing`,[s.order_id,c.merchant_id,fulfillmentFee,s.currency,input.refundId,`revenue-refund:${input.refundId}:${c.merchant_id}:fulfillment`,JSON.stringify({source:'seller-settlement-reversal'})]);
    reversed=money(reversed+target);
  }
  await tx.query(`update trust_marketplace_payment_settlements set status=case when $2 >= gross_amount then 'REVERSED' else status end,reversed_at=case when $2 >= gross_amount then now() else reversed_at end,updated_at=now() where id=$1`,[s.id,input.refundAmount]);
  return {reversed,replay:false};
}

export async function reverseSellerSettlementForReturnTx(tx:PoolClient,input:{paymentId:string;refundId:string;returnId:string}){
  const rows=await tx.query<{seller_order_id:string;merchant_id:string;amount:string;currency:string}>(`select ri.seller_order_id,so.merchant_id,coalesce(sum(ri.quantity*oi.unit_price),0)::numeric amount,coalesce(p.currency,'EGP') currency
    from trust_return_items ri join trust_order_items oi on oi.id=ri.order_item_id
    join trust_seller_orders so on so.id=ri.seller_order_id
    join trust_payments p on p.id=$1 where ri.return_id=$2 and ri.seller_order_id is not null
    group by ri.seller_order_id,so.merchant_id,p.currency having coalesce(sum(ri.quantity*oi.unit_price),0)>0`,[input.paymentId,input.returnId]);
  let reversed=0;
  for(const r of rows.rows){
    const amount=money(Number(r.amount)); if(amount<=0) continue;
    const existing=await tx.query<{amount:string}>('select coalesce(sum(amount),0)::numeric amount from trust_seller_return_refund_allocations where refund_id=$1 and seller_order_id=$2',[input.refundId,r.seller_order_id]);
    if(Number(existing.rows[0]?.amount||0)>0) continue;
    const inserted=await tx.query<{id:string}>(`insert into trust_seller_return_refund_allocations(refund_id,return_id,seller_order_id,merchant_id,amount,currency) values($1,$2,$3,$4,$5,$6) on conflict(refund_id,seller_order_id) do nothing returning id`,[input.refundId,input.returnId,r.seller_order_id,r.merchant_id,amount,r.currency]);
    if(!inserted.rows[0]) continue;
    const bal=await tx.query<{pending_balance:string;available_balance:string;held_balance:string}>(`select pending_balance,available_balance,held_balance from trust_marketplace_seller_balances where merchant_id=$1 for update`,[r.merchant_id]);
    if(!bal.rows[0]) throw new Error('SELLER_BALANCE_NOT_FOUND');
    const pending=Math.min(Number(bal.rows[0].pending_balance),amount);
    const available=Math.min(Number(bal.rows[0].available_balance),money(amount-pending));
    const deficit=money(amount-pending-available);
    await tx.query(`update trust_marketplace_seller_balances set available_balance=greatest(0,available_balance-$1),pending_balance=greatest(0,pending_balance-$2),held_balance=held_balance+$3,updated_at=now() where merchant_id=$4`,[available,pending,deficit,r.merchant_id]);
    await appendPaymentLedgerTx(tx,{paymentId:input.paymentId,merchantId:r.merchant_id,entryType:'REFUND',amount,direction:'DEBIT',currency:r.currency,idempotencyKey:`seller-return-refund:${input.refundId}:${r.seller_order_id}`,metadata:{refundId:input.refundId,returnId:input.returnId,sellerOrderId:r.seller_order_id,source:'seller-scoped-return'}});
    await tx.query(`update trust_seller_order_financials set refunded_amount=least(seller_credit_amount,refunded_amount+$1),released_amount=greatest(0,released_amount-$1),status=case when $1>=seller_credit_amount then 'RELEASED' when $2>0 then 'PAYOUT_HELD' else status end,updated_at=now() where seller_order_id=$3`,[amount,deficit,r.seller_order_id]);
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.seller_order.refund_allocated',$1,$2::jsonb)`,[r.seller_order_id,JSON.stringify({refundId:input.refundId,returnId:input.returnId,sellerOrderId:r.seller_order_id,merchantId:r.merchant_id,amount,currency:r.currency,deficit})]);
    reversed=money(reversed+amount);
  }
  return {reversed,replay:false,allocations:rows.rows.length};
}

export async function reconcileSellerBalancesTx(tx:PoolClient,input:{merchantId?:string;idempotencyKey:string}){
  const scope=input.merchantId??'ALL';
  const existing=await tx.query<any>('select * from trust_marketplace_reconciliation_runs where idempotency_key=$1',[input.idempotencyKey]);
  if(existing.rows[0])return existing.rows[0];
  const merchants=await tx.query<{merchant_id:string;available_balance:string;pending_balance:string;held_balance:string}>(`select merchant_id,available_balance,pending_balance,held_balance from trust_marketplace_seller_balances ${input.merchantId?'where merchant_id=$1':''} order by merchant_id`,input.merchantId?[input.merchantId]:[]);
  let mismatches=0;
  for(const m of merchants.rows){
    const l=await tx.query<{credit:string;debit:string}>(`select coalesce(sum(amount) filter(where direction='CREDIT'),0)::numeric credit,coalesce(sum(amount) filter(where direction='DEBIT'),0)::numeric debit from trust_marketplace_payment_ledger where merchant_id=$1 and entry_type in ('SELLER_CREDIT','PAYOUT','PAYOUT_REVERSAL','REFUND','CHARGEBACK')`,[m.merchant_id]);
    const derived=money(Number(l.rows[0].credit)-Number(l.rows[0].debit));
    const reported=money(Number(m.available_balance)+Number(m.pending_balance)+Number(m.held_balance));
    if(Math.abs(derived-reported)>0.01)mismatches++;
  }
  const r=await tx.query<any>(`insert into trust_marketplace_reconciliation_runs(scope,status,checked_count,mismatch_count,details_json,idempotency_key,completed_at) values($1,'SUCCEEDED',$2,$3,$4::jsonb,$5,now()) returning *`,[scope,merchants.rowCount,mismatches,JSON.stringify({scope}),input.idempotencyKey]);
  return r.rows[0];
}
