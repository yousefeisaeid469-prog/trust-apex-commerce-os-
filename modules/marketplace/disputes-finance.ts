import type {PoolClient} from 'pg';
import {appendPaymentLedgerTx} from './payment-ledger';
const money=(n:number)=>Number(Number(n).toFixed(2));
function positive(n:number){if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_AMOUNT');}

export async function openDisputeTx(tx:PoolClient,input:{paymentId:string;orderId?:string;amount:number;kind:'CHARGEBACK'|'DISPUTE'|'FRAUD';reasonCode?:string;provider?:string;providerCaseId?:string;idempotencyKey:string}){
  positive(input.amount);
  const old=await tx.query<any>('select id,status,amount from trust_marketplace_disputes where idempotency_key=$1 for update',[input.idempotencyKey]);
  if(old.rows[0])return {disputeId:old.rows[0].id,status:old.rows[0].status,amount:Number(old.rows[0].amount),replay:true};
  const p=await tx.query<{order_id:string;currency:string}>(`select order_id,currency from trust_payments where id=$1 for update`,[input.paymentId]);
  if(!p.rows[0])throw new Error('PAYMENT_NOT_FOUND');
  if(input.orderId && input.orderId!==p.rows[0].order_id)throw new Error('PAYMENT_ORDER_MISMATCH');
  const credits=await tx.query<{merchant_id:string;amount:string}>(`select merchant_id,sum(amount)::numeric amount from trust_marketplace_payment_ledger where payment_id=$1 and entry_type='SELLER_CREDIT' and direction='CREDIT' and merchant_id is not null group by merchant_id order by merchant_id for update`,[input.paymentId]);
  if(!credits.rows.length)throw new Error('SELLER_SETTLEMENT_NOT_FOUND');
  const gross=credits.rows.reduce((n,c)=>n+Number(c.amount),0);
  if(input.amount>gross+0.01)throw new Error('DISPUTE_EXCEEDS_SELLER_SETTLEMENT');
  const orderId=input.orderId??p.rows[0].order_id;
  const r=await tx.query<{id:string}>(`insert into trust_marketplace_disputes(payment_id,order_id,merchant_id,kind,status,amount,currency,reason_code,provider,provider_case_id,idempotency_key) values($1,$2,$3,$4,'OPEN',$5,$6,$7,$8,$9,$10) on conflict(idempotency_key) do nothing returning id`,[input.paymentId,orderId,credits.length===1?credits[0].merchant_id:null,input.kind,input.amount,p.rows[0].currency,input.reasonCode??null,input.provider??null,input.providerCaseId??null,input.idempotencyKey]);
  if(!r.rows[0])throw new Error('DISPUTE_RETRY_REQUIRED');
  let remaining=input.amount;
  for(let i=0;i<credits.rows.length;i++){
    const c=credits.rows[i];
    const share=i===credits.rows.length-1?remaining:money(input.amount*Number(c.amount)/gross);
    if(share<=0)continue;
    remaining=money(remaining-share);
    await tx.query(`insert into trust_marketplace_dispute_allocations(dispute_id,merchant_id,amount,idempotency_key) values($1,$2,$3,$4)`,[r.rows[0].id,c.merchant_id,share,`dispute-allocation:${r.rows[0].id}:${c.merchant_id}`]);
  }
  const total=await tx.query<{total:string;count:string}>(`select coalesce(sum(amount),0)::numeric total,count(*)::int count from trust_marketplace_dispute_allocations where dispute_id=$1`,[r.rows[0].id]);
  if(Math.abs(Number(total.rows[0].total)-input.amount)>0.01)throw new Error('DISPUTE_ALLOCATION_INCOMPLETE');
  await tx.query(`update trust_marketplace_disputes set allocation_total=$2 where id=$1`,[r.rows[0].id,input.amount]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.dispute.opened',$1,$2::jsonb)`,[orderId,JSON.stringify({disputeId:r.rows[0].id,paymentId:input.paymentId,amount:input.amount,kind:input.kind,merchantCount:Number(total.rows[0].count)})]);
  return {disputeId:r.rows[0].id,status:'OPEN',amount:input.amount,replay:false,merchantCount:Number(total.rows[0].count)};
}

export async function resolveDisputeTx(tx:PoolClient,input:{disputeId:string;status:'WON'|'LOST'|'CLOSED';idempotencyKey:string}){
  const d=await tx.query<any>('select * from trust_marketplace_disputes where id=$1 for update',[input.disputeId]);
  if(!d.rows[0])throw new Error('DISPUTE_NOT_FOUND'); const row=d.rows[0];
  if(row.status===input.status)return {disputeId:row.id,status:row.status,replay:true};
  if(['WON','LOST','CLOSED'].includes(row.status))throw new Error(`DISPUTE_TERMINAL:${row.status}`);
  if(input.status==='LOST'){
    const alloc=await tx.query<{merchant_id:string;amount:string}>(`select merchant_id,amount from trust_marketplace_dispute_allocations where dispute_id=$1 order by merchant_id for update`,[input.disputeId]);
    if(!alloc.rows.length)throw new Error('DISPUTE_ALLOCATION_MISSING');
    const total=money(alloc.rows.reduce((n,a)=>n+Number(a.amount),0));
    if(Math.abs(total-Number(row.amount))>0.01)throw new Error('DISPUTE_ALLOCATION_INCOMPLETE');
    for(const a of alloc.rows){
      const amount=money(Number(a.amount));
      const bal=await tx.query<{pending_balance:string;available_balance:string;held_balance:string}>(`select pending_balance,available_balance,held_balance from trust_marketplace_seller_balances where merchant_id=$1 for update`,[a.merchant_id]);
      if(!bal.rows[0])throw new Error('SELLER_BALANCE_NOT_FOUND');
      const pending=Math.min(Number(bal.rows[0].pending_balance),amount);
      const available=Math.min(Number(bal.rows[0].available_balance),money(amount-pending));
      const deficit=money(amount-pending-available);
      await tx.query(`update trust_marketplace_seller_balances set pending_balance=greatest(0,pending_balance-$1),available_balance=greatest(0,available_balance-$2),held_balance=held_balance+$3,updated_at=now() where merchant_id=$4`,[pending,available,deficit,a.merchant_id]);
      await appendPaymentLedgerTx(tx,{paymentId:row.payment_id,merchantId:a.merchant_id,entryType:'CHARGEBACK',amount,direction:'DEBIT',currency:row.currency,idempotencyKey:`dispute:${row.id}:${a.merchant_id}`});
    }
  }
  await tx.query(`update trust_marketplace_disputes set status=$2,resolved_at=now(),updated_at=now() where id=$1`,[row.id,input.status]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.dispute.resolved',$1,$2::jsonb)`,[row.id,JSON.stringify({disputeId:row.id,status:input.status,amount:Number(row.amount),idempotencyKey:input.idempotencyKey})]);
  return {disputeId:row.id,status:input.status,replay:false};
}

export async function reconcilePayoutTx(tx:PoolClient,input:{payoutId:string;provider:string;providerReference:string;settledAmount:number;providerEventId?:string;idempotencyKey:string;merchantId?:string}){
  positive(input.settledAmount);
  const p=await tx.query<any>(`select * from trust_marketplace_payout_requests where id=$1 ${input.merchantId?'and merchant_id=$2':''} for update`,input.merchantId?[input.payoutId,input.merchantId]:[input.payoutId]);
  if(!p.rows[0])throw new Error(input.merchantId?'PAYOUT_NOT_FOUND_OR_NOT_OWNED':'PAYOUT_NOT_FOUND');
  const expected=money(Number(p.rows[0].amount)); const settled=money(input.settledAmount);
  const status=expected===settled?'MATCHED':'MISMATCH';
  const old=await tx.query<any>('select * from trust_marketplace_payout_reconciliations where idempotency_key=$1 for update',[input.idempotencyKey]);
  if(old.rows[0])return {reconciliationId:old.rows[0].id,status:old.rows[0].status,workflowStatus:old.rows[0].workflow_status,expectedAmount:Number(old.rows[0].expected_amount),settledAmount:Number(old.rows[0].settled_amount),replay:true};
  if(input.providerEventId){
    const dup=await tx.query<any>('select * from trust_marketplace_payout_reconciliations where provider=$1 and provider_event_id=$2 for update',[input.provider,input.providerEventId]);
    if(dup.rows[0]){
      if(dup.rows[0].payout_id!==input.payoutId||Number(dup.rows[0].settled_amount)!==settled||dup.rows[0].provider_reference!==input.providerReference)throw new Error('PAYOUT_PROVIDER_EVENT_PAYLOAD_CONFLICT');
      return {reconciliationId:dup.rows[0].id,status:dup.rows[0].status,workflowStatus:dup.rows[0].workflow_status,expectedAmount:Number(dup.rows[0].expected_amount),settledAmount:Number(dup.rows[0].settled_amount),replay:true,providerEventReplay:true};
    }
  }
  const r=await tx.query<{id:string}>(`insert into trust_marketplace_payout_reconciliations(payout_id,provider,provider_reference,expected_amount,settled_amount,status,workflow_status,provider_event_id,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,[input.payoutId,input.provider,input.providerReference,expected,settled,status,status==='MISMATCH'?'OPEN':'RESOLVED',input.providerEventId??null,input.idempotencyKey]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.payout.reconciled',$1,$2::jsonb)`,[input.payoutId,JSON.stringify({payoutId:input.payoutId,status,expectedAmount:expected,settledAmount:settled,provider:input.provider,providerReference:input.providerReference,providerEventId:input.providerEventId??null})]);
  return {reconciliationId:r.rows[0].id,status,workflowStatus:status==='MISMATCH'?'OPEN':'RESOLVED',expectedAmount:expected,settledAmount:settled,replay:false};
}

export async function advancePayoutReconciliationTx(tx:PoolClient,input:{reconciliationId:string;workflowStatus:'INVESTIGATING'|'EVIDENCE_REVIEW'|'ADJUSTMENT_PENDING';actorId:string;evidence?:Record<string,unknown>;idempotencyKey:string}){
  const r=await tx.query<any>('select * from trust_marketplace_payout_reconciliations where id=$1 for update',[input.reconciliationId]); if(!r.rows[0])throw new Error('RECONCILIATION_NOT_FOUND');
  if(r.rows[0].status!=='MISMATCH')throw new Error('RECONCILIATION_NOT_MISMATCH');
  if(r.rows[0].workflow_status===input.workflowStatus)return {reconciliationId:r.rows[0].id,workflowStatus:r.rows[0].workflow_status,replay:true};
  const order=['OPEN','INVESTIGATING','EVIDENCE_REVIEW','ADJUSTMENT_PENDING','RESOLVED'];
  if(order.indexOf(input.workflowStatus)<=order.indexOf(r.rows[0].workflow_status))throw new Error('RECONCILIATION_INVALID_TRANSITION');
  await tx.query(`update trust_marketplace_payout_reconciliations set workflow_status=$2,evidence_json=coalesce(evidence_json,'{}'::jsonb)||$3::jsonb,last_actor_id=$4,updated_at=now() where id=$1`,[input.reconciliationId,input.workflowStatus,JSON.stringify(input.evidence??{}),input.actorId]);
  return {reconciliationId:r.rows[0].id,workflowStatus:input.workflowStatus,replay:false};
}

export async function resolvePayoutReconciliationTx(tx:PoolClient,input:{reconciliationId:string;actorId:string;decision:'ACCEPT_VARIANCE'|'REQUIRE_PROVIDER_RETRY';adjustmentAmount?:number;note?:string;idempotencyKey:string}){
  const r=await tx.query<any>('select * from trust_marketplace_payout_reconciliations where id=$1 for update',[input.reconciliationId]); if(!r.rows[0])throw new Error('RECONCILIATION_NOT_FOUND');
  const row=r.rows[0]; if(row.status!=='MISMATCH')throw new Error('RECONCILIATION_NOT_MISMATCH');
  if(row.workflow_status!=='ADJUSTMENT_PENDING')throw new Error('RECONCILIATION_ADJUSTMENT_NOT_READY');
  const existing=await tx.query<any>('select id from trust_marketplace_reconciliation_actions where idempotency_key=$1',[input.idempotencyKey]); if(existing.rows[0])return {actionId:existing.rows[0].id,replay:true};
  const delta=money(input.adjustmentAmount??0);
  if(input.decision==='ACCEPT_VARIANCE' && Math.abs(delta)>0){
    const payout=await tx.query<any>('select merchant_id,currency from trust_marketplace_payout_requests where id=$1 for update',[row.payout_id]); if(!payout.rows[0])throw new Error('PAYOUT_NOT_FOUND');
    if(Math.abs(delta)>0){
      const amount=Math.abs(delta);
      if(delta>0){
        await tx.query(`update trust_marketplace_seller_balances set available_balance=available_balance+$1,updated_at=now() where merchant_id=$2`,[amount,payout.rows[0].merchant_id]);
        await appendPaymentLedgerTx(tx,{merchantId:payout.rows[0].merchant_id,entryType:'PAYOUT_ADJUSTMENT',amount,direction:'CREDIT',currency:payout.rows[0].currency,idempotencyKey:`recon:${row.id}:adjustment`});
      }else{
        const bal=await tx.query<any>('select available_balance from trust_marketplace_seller_balances where merchant_id=$1 for update',[payout.rows[0].merchant_id]); if(!bal.rows[0]||Number(bal.rows[0].available_balance)<amount)throw new Error('INSUFFICIENT_AVAILABLE_BALANCE_FOR_ADJUSTMENT');
        await tx.query(`update trust_marketplace_seller_balances set available_balance=available_balance-$1,updated_at=now() where merchant_id=$2`,[amount,payout.rows[0].merchant_id]);
        await appendPaymentLedgerTx(tx,{merchantId:payout.rows[0].merchant_id,entryType:'PAYOUT_ADJUSTMENT',amount,direction:'DEBIT',currency:payout.rows[0].currency,idempotencyKey:`recon:${row.id}:adjustment`});
      }
    }
  }
  const action=await tx.query<{id:string}>(`insert into trust_marketplace_reconciliation_actions(reconciliation_id,decision,adjustment_amount,note,actor_id,idempotency_key) values($1,$2,$3,$4,$5,$6) returning id`,[row.id,input.decision,delta,input.note??null,input.actorId,input.idempotencyKey]);
  await tx.query(`update trust_marketplace_payout_reconciliations set workflow_status='RESOLVED',resolution_decision=$2,resolved_at=now(),updated_at=now() where id=$1`,[row.id,input.decision]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.payout.reconciliation.resolved',$1,$2::jsonb)`,[row.payout_id,JSON.stringify({reconciliationId:row.id,decision:input.decision,adjustmentAmount:delta,actorId:input.actorId})]);
  return {actionId:action.rows[0].id,replay:false,workflowStatus:'RESOLVED',adjustmentAmount:delta};
}

export async function generateSellerStatementTx(tx:PoolClient,input:{merchantId:string;periodStart:string;periodEnd:string;currency?:string;idempotencyKey:string}){
  const currency=input.currency??'EGP';
  const old=await tx.query<any>('select * from trust_marketplace_seller_statements where idempotency_key=$1',[input.idempotencyKey]); if(old.rows[0])return {...old.rows[0],replay:true};
  const prior=await tx.query<{balance:string}>(`select coalesce(sum(case when direction='CREDIT' then amount else -amount end),0)::numeric balance from trust_marketplace_payment_ledger where merchant_id=$1 and created_at<$2 and currency=$3`,[input.merchantId,input.periodStart,currency]);
  const flow=await tx.query<{credits:string;debits:string}>(`select coalesce(sum(amount) filter(where direction='CREDIT'),0)::numeric credits,coalesce(sum(amount) filter(where direction='DEBIT'),0)::numeric debits from trust_marketplace_payment_ledger where merchant_id=$1 and created_at>=$2 and created_at<$3 and currency=$4`,[input.merchantId,input.periodStart,input.periodEnd,currency]);
  const opening=money(Number(prior.rows[0].balance)),credits=money(Number(flow.rows[0].credits)),debits=money(Number(flow.rows[0].debits)),closing=money(opening+credits-debits);
  const r=await tx.query<any>(`insert into trust_marketplace_seller_statements(merchant_id,period_start,period_end,opening_balance,credits,debits,closing_balance,currency,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(idempotency_key) do nothing returning *`,[input.merchantId,input.periodStart,input.periodEnd,opening,credits,debits,closing,currency,input.idempotencyKey]);
  return {...(r.rows[0]??{}),replay:!r.rows[0]};
}
