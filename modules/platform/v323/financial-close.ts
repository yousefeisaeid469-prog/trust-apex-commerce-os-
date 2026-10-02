import type { PoolClient } from 'pg';
import { withPgTransaction, query } from '../db/postgres';
import { applyPayoutEventTx } from '../../marketplace/financial-loop';

const money=(v:unknown)=>Number(Number(v??0).toFixed(2));
const clean=(v:unknown,max=220)=>String(v??'').trim().slice(0,max);

export async function applyPayoutProviderEvent(input:{payoutId:string;status:'PROCESSING'|'PAID'|'FAILED'|'HELD'|'REVERSED';providerReference?:string;failureCode?:string;idempotencyKey:string}){
  const key=clean(input.idempotencyKey);
  if(!key)throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  return withPgTransaction(async tx=>{
    const existing=await tx.query<any>('select * from trust_marketplace_reconciliation_actions where idempotency_key=$1 for update',[key]);
    if(existing.rows[0])return {actionId:existing.rows[0].id,replay:true};
    const result=await applyPayoutEventTx(tx,input);
    const action=await tx.query<{id:string}>(`insert into trust_marketplace_reconciliation_actions(reconciliation_id,decision,adjustment_amount,note,actor_id,idempotency_key)
      select r.id,'REQUIRE_PROVIDER_RETRY',0,$2,null,$1
      from trust_marketplace_payout_reconciliations r
      where r.payout_id=$3
      order by r.created_at desc limit 1
      on conflict(idempotency_key) do nothing returning id`,[key,`provider payout event: ${input.status}`,input.payoutId]);
    return {...result,actionId:action.rows[0]?.id??null,replay:false};
  });
}

async function recordItem(tx:PoolClient,runId:string,entityType:string,entityId:string,checkCode:string,expected:number|null,observed:number|null,status:'PASS'|'MISMATCH',details:unknown){
  await tx.query(`insert into trust_financial_close_items(run_id,entity_type,entity_id,check_code,expected_amount,observed_amount,status,details_json)
    values($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    on conflict(run_id,entity_type,entity_id,check_code) do update set expected_amount=excluded.expected_amount,observed_amount=excluded.observed_amount,status=excluded.status,details_json=excluded.details_json`,
    [runId,entityType,entityId,checkCode,expected,observed,status,JSON.stringify(details??{})]);
}

export async function runFinancialClose(input:{scope?:string;merchantId?:string;idempotencyKey:string}){
  const key=clean(input.idempotencyKey);
  if(!key)throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  return withPgTransaction(async tx=>{
    const old=await tx.query<any>('select * from trust_financial_close_runs where idempotency_key=$1 for update',[key]);
    if(old.rows[0])return {...old.rows[0],replay:true};
    const scope=input.scope??(input.merchantId?`MERCHANT:${input.merchantId}`:'GLOBAL');
    const run=(await tx.query<{id:string}>(`insert into trust_financial_close_runs(scope,status,idempotency_key) values($1,'RUNNING',$2) returning id`,[scope,key])).rows[0];
    const mismatches:any[]=[];

    const settlements=await tx.query<any>(`select id,payment_id,order_id,gross_amount,merchandise_gross,seller_net,platform_fee,payment_fee,fulfillment_fee,return_fee,currency,status
      from trust_marketplace_payment_settlements
      ${input.merchantId?`where exists(select 1 from trust_marketplace_payment_ledger l where l.payment_id=trust_marketplace_payment_settlements.payment_id and l.merchant_id=$1)` : ''}
      order by created_at`,input.merchantId?[input.merchantId]:[]);
    for(const s of settlements.rows){
      const expected=money(s.merchandise_gross ?? (money(s.seller_net)+money(s.platform_fee)+money(s.payment_fee)+money(s.fulfillment_fee)+money(s.return_fee)));
      const observed=money(s.seller_net)+money(s.platform_fee)+money(s.payment_fee)+money(s.fulfillment_fee)+money(s.return_fee);
      const ok=Math.abs(expected-observed)<=0.01;
      await recordItem(tx,run.id,'SETTLEMENT',s.id,'GROSS_SPLIT',expected,observed,ok?'PASS':'MISMATCH',{paymentId:s.payment_id,status:s.status,customerGross:money(s.gross_amount),merchandiseGross:expected});
      if(!ok)mismatches.push({entityType:'SETTLEMENT',entityId:s.id,checkCode:'GROSS_SPLIT',expected,observed});
    }

    const refunds=await tx.query<any>(`select r.id,r.payment_id,r.amount,r.status,p.amount payment_amount,p.currency from trust_refunds r join trust_payments p on p.id=r.payment_id
      ${input.merchantId?`where exists(select 1 from trust_marketplace_payment_ledger l where l.payment_id=r.payment_id and l.merchant_id=$1)` : ''}
      order by r.created_at`,input.merchantId?[input.merchantId]:[]);
    for(const r of refunds.rows){
      const ledger=await tx.query<{amount:string}>(`select coalesce(sum(amount),0)::numeric amount from trust_marketplace_payment_ledger where payment_id=$1 and entry_type='REFUND' and direction='DEBIT' and metadata_json->>'refundId'=$2`,[r.payment_id,r.id]);
      const expected=r.status==='succeeded'?money(r.amount):0;
      const observed=money(ledger.rows[0].amount);
      const ok=Math.abs(expected-observed)<=0.01;
      await recordItem(tx,run.id,'REFUND',r.id,'REFUND_LEDGER',expected,observed,ok?'PASS':'MISMATCH',{status:r.status});
      if(!ok)mismatches.push({entityType:'REFUND',entityId:r.id,checkCode:'REFUND_LEDGER',expected,observed});
    }

    const payouts=await tx.query<any>(`select id,merchant_id,amount,currency,status,provider,provider_reference from trust_marketplace_payout_requests
      ${input.merchantId?'where merchant_id=$1':''} order by requested_at`,input.merchantId?[input.merchantId]:[]);
    for(const p of payouts.rows){
      const ledger=await tx.query<{amount:string}>(`select coalesce(sum(amount),0)::numeric amount from trust_marketplace_payment_ledger where merchant_id=$1 and entry_type='PAYOUT' and direction='DEBIT' and metadata_json->>'payoutId'=$2`,[p.merchant_id,p.id]);
      const expected=p.status==='PAID'?money(p.amount):0;
      const observed=money(ledger.rows[0].amount);
      const ok=Math.abs(expected-observed)<=0.01;
      await recordItem(tx,run.id,'PAYOUT',p.id,'PAID_LEDGER',expected,observed,ok?'PASS':'MISMATCH',{status:p.status});
      if(!ok)mismatches.push({entityType:'PAYOUT',entityId:p.id,checkCode:'PAID_LEDGER',expected,observed});
      if(p.status==='PAID' && p.provider && p.provider_reference){
        const recon=await tx.query<{settled_amount:string;status:string}>(`select settled_amount,status from trust_marketplace_payout_reconciliations where payout_id=$1 order by created_at desc limit 1`,[p.id]);
        const settled=recon.rows[0]?.settled_amount==null?null:money(recon.rows[0].settled_amount);
        const match=settled!=null && Math.abs(settled-money(p.amount))<=0.01;
        await recordItem(tx,run.id,'PAYOUT',p.id,'PROVIDER_SETTLEMENT',money(p.amount),settled,match?'PASS':'MISMATCH',{reconciliationStatus:recon.rows[0]?.status??'MISSING'});
        if(!match)mismatches.push({entityType:'PAYOUT',entityId:p.id,checkCode:'PROVIDER_SETTLEMENT',expected:money(p.amount),observed:settled});
      }
    }

    const revenue=await tx.query<{count:string}>(`select count(*)::int count from trust_revenue_ledger ${input.merchantId?'where merchant_id=$1':''}`,input.merchantId?[input.merchantId]:[]);
    const count=Number(revenue.rows[0].count);
    await tx.query(`update trust_financial_close_runs set status='SUCCEEDED',checked_settlements=$2,checked_refunds=$3,checked_payouts=$4,checked_revenue=$5,mismatch_count=$6,mismatches_json=$7::jsonb,completed_at=now() where id=$1`,[run.id,settlements.rowCount,refunds.rowCount,payouts.rowCount,count,mismatches.length,JSON.stringify(mismatches)]);
    return {runId:run.id,status:'SUCCEEDED',scope,checkedSettlements:settlements.rowCount,checkedRefunds:refunds.rowCount,checkedPayouts:payouts.rowCount,checkedRevenue:count,mismatchCount:mismatches.length,mismatches,replay:false};
  });
}

export async function financialCloseHistory(limit=50){
  const safe=Math.max(1,Math.min(200,Math.trunc(limit||50)));
  const r=await query(`select id,scope,status,checked_settlements,checked_refunds,checked_payouts,checked_revenue,mismatch_count,created_at,completed_at from trust_financial_close_runs order by created_at desc limit $1`,[safe]);
  return r.rows;
}
