import type {PoolClient} from 'pg';

const money=(n:number)=>Number(Number(n).toFixed(2));
const abs=(n:number)=>Math.abs(money(n));
const EPSILON=0.01;

type Severity='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
type FindingType='BALANCE_LEDGER_DRIFT'|'PAYOUT_OVERALLOCATION'|'PAYOUT_HOLD_DRIFT'|'SELLER_ORDER_PAYOUT_DRIFT';

export type ReconciliationFinding={
  id:string; merchantId:string; currency:string; findingType:FindingType; severity:Severity;
  expectedAmount:number; observedAmount:number; delta:number; status:string; details:Record<string,unknown>;
};

function severity(delta:number):Severity{
  const n=abs(delta);
  if(n>=10000)return 'CRITICAL';
  if(n>=1000)return 'HIGH';
  if(n>=100)return 'MEDIUM';
  return 'LOW';
}

async function addFinding(tx:PoolClient,input:{runId:string;merchantId:string;currency:string;findingType:FindingType;expected:number;observed:number;details:Record<string,unknown>}):Promise<ReconciliationFinding>{
  const delta=money(input.observed-input.expected);
  const key=`v351:${input.runId}:${input.merchantId}:${input.currency}:${input.findingType}:${input.details.scopeKey??'global'}`;
  const r=await tx.query<any>(`insert into trust_marketplace_reconciliation_findings
    (run_id,merchant_id,currency,finding_type,severity,expected_amount,observed_amount,delta,details_json,status,idempotency_key)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'OPEN',$10)
    on conflict(idempotency_key) do update set updated_at=now()
    returning *`,[input.runId,input.merchantId,input.currency,input.findingType,severity(delta),money(input.expected),money(input.observed),delta,JSON.stringify(input.details),key]);
  const row=r.rows[0];
  return {id:String(row.id),merchantId:String(row.merchant_id),currency:String(row.currency),findingType:row.finding_type,severity:row.severity,expectedAmount:Number(row.expected_amount),observedAmount:Number(row.observed_amount),delta:Number(row.delta),status:row.status,details:row.details_json??{}};
}

export async function runSellerFinancialIntegrityReconciliationTx(tx:PoolClient,input:{merchantId?:string;currency?:string;idempotencyKey:string}){
  const scope=input.merchantId?`MERCHANT:${input.merchantId}`:'ALL';
  const old=await tx.query<any>('select * from trust_marketplace_reconciliation_runs where idempotency_key=$1 for update',[input.idempotencyKey]);
  if(old.rows[0]){
    const findings=await tx.query<any>('select * from trust_marketplace_reconciliation_findings where run_id=$1 order by created_at',[old.rows[0].id]);
    return {run:old.rows[0],findings:findings.rows,replay:true};
  }
  const run=await tx.query<any>(`insert into trust_marketplace_reconciliation_runs(scope,status,checked_count,mismatch_count,details_json,idempotency_key,started_at,merchant_id,currency)
    values($1,'RUNNING',0,0,'{}'::jsonb,$2,now(),$3,$4) returning *`,[scope,input.idempotencyKey,input.merchantId??null,input.currency??null]);
  const runId=String(run.rows[0].id);
  try{
    const merchants=await tx.query<any>(`select merchant_id,pending_balance,available_balance,held_balance,currency
      from trust_marketplace_seller_balances
      ${input.merchantId?'where merchant_id=$1':''}
      ${input.currency?(input.merchantId?'and':'where')+' currency=$'+(input.merchantId?2:1):''}
      order by merchant_id`,input.merchantId&&input.currency?[input.merchantId,input.currency]:input.merchantId?[input.merchantId]:input.currency?[input.currency]:[]);
    const findings:ReconciliationFinding[]=[];
    for(const m of merchants.rows){
      const merchantId=String(m.merchant_id), currency=String(m.currency);
      const ledger=await tx.query<any>(`select
        coalesce(sum(amount) filter(where direction='CREDIT' and entry_type in ('SELLER_CREDIT','PAYOUT_REVERSAL')),0)::numeric as credits,
        coalesce(sum(amount) filter(where direction='DEBIT' and entry_type in ('REFUND','CHARGEBACK','PAYOUT')),0)::numeric as debits,
        coalesce(sum(amount) filter(where entry_type='PAYOUT_ADJUSTMENT' and direction='CREDIT'),0)::numeric as adjustment_credits,
        coalesce(sum(amount) filter(where entry_type='PAYOUT_ADJUSTMENT' and direction='DEBIT'),0)::numeric as adjustment_debits
        from trust_marketplace_payment_ledger where merchant_id=$1 and currency=$2`,[merchantId,currency]);
      const l=ledger.rows[0];
      const expected=money(Number(l.credits)+Number(l.adjustment_credits)-Number(l.debits)-Number(l.adjustment_debits));
      const observed=money(Number(m.pending_balance)+Number(m.available_balance)+Number(m.held_balance));
      if(abs(observed-expected)>EPSILON) findings.push(await addFinding(tx,{runId,merchantId,currency,findingType:'BALANCE_LEDGER_DRIFT',expected,observed,details:{scopeKey:'balance-ledger',ledgerCredits:Number(l.credits),ledgerDebits:Number(l.debits),adjustmentCredits:Number(l.adjustment_credits),adjustmentDebits:Number(l.adjustment_debits),pending:Number(m.pending_balance),available:Number(m.available_balance),held:Number(m.held_balance)}}));

      const allocation=await tx.query<any>(`select
        coalesce(sum(a.amount),0)::numeric allocated,
        coalesce(sum(greatest(sf.released_amount-sf.refunded_amount,0)),0)::numeric eligible
        from trust_marketplace_payout_eligibility_allocations a
        join trust_marketplace_payout_requests p on p.id=a.payout_id and p.status in ('REQUESTED','PROCESSING','HELD','PAID')
        left join trust_seller_order_financials sf on sf.seller_order_id=a.seller_order_id
        where a.merchant_id=$1 and a.currency=$2`,[merchantId,currency]);
      const allocated=money(Number(allocation.rows[0]?.allocated||0)), eligible=money(Number(allocation.rows[0]?.eligible||0));
      if(allocated>eligible+EPSILON) findings.push(await addFinding(tx,{runId,merchantId,currency,findingType:'PAYOUT_OVERALLOCATION',expected:eligible,observed:allocated,details:{scopeKey:'payout-allocation',allocated,eligible}}));

      const payoutHold=await tx.query<any>(`select coalesce(sum(h.amount),0)::numeric amount from trust_marketplace_payout_eligibility_holds h where h.merchant_id=$1 and h.currency=$2 and h.status='ACTIVE'`,[merchantId,currency]);
      const pendingPayout=await tx.query<any>(`select coalesce(sum(amount),0)::numeric amount from trust_marketplace_payout_requests where merchant_id=$1 and currency=$2 and status in ('REQUESTED','PROCESSING','HELD')`,[merchantId,currency]);
      const hold=money(Number(payoutHold.rows[0]?.amount||0)), pending=money(Number(pendingPayout.rows[0]?.amount||0));
      if(abs(hold-pending)>EPSILON) findings.push(await addFinding(tx,{runId,merchantId,currency,findingType:'PAYOUT_HOLD_DRIFT',expected:pending,observed:hold,details:{scopeKey:'payout-hold',activeEligibilityHolds:hold,pendingPayouts:pending}}));

      const orders=await tx.query<any>(`select sf.seller_order_id,sf.seller_credit_amount,sf.released_amount,sf.refunded_amount,
          coalesce((select sum(a.amount) from trust_marketplace_payout_eligibility_allocations a join trust_marketplace_payout_requests p on p.id=a.payout_id where a.seller_order_id=sf.seller_order_id and p.status in ('REQUESTED','PROCESSING','HELD','PAID')),0)::numeric as eligible_allocated,
          coalesce((select sum(a.amount) from trust_seller_order_payout_allocations a join trust_marketplace_payout_requests p on p.id=a.payout_id where a.seller_order_id=sf.seller_order_id and p.status in ('REQUESTED','PROCESSING','HELD','PAID')),0)::numeric as legacy_allocated
        from trust_seller_order_financials sf where sf.merchant_id=$1 and sf.currency=$2`,[merchantId,currency]);
      for(const o of orders.rows){
        const eligibleOrder=money(Math.max(0,Number(o.released_amount)-Number(o.refunded_amount)));
        const allocatedOrder=money(Number(o.eligible_allocated)+Number(o.legacy_allocated));
        if(allocatedOrder>eligibleOrder+EPSILON) findings.push(await addFinding(tx,{runId,merchantId,currency,findingType:'SELLER_ORDER_PAYOUT_DRIFT',expected:eligibleOrder,observed:allocatedOrder,details:{scopeKey:`seller-order:${o.seller_order_id}`,sellerOrderId:o.seller_order_id,sellerCredit:Number(o.seller_credit_amount),released:Number(o.released_amount),refunded:Number(o.refunded_amount),eligibilityAllocated:Number(o.eligible_allocated),legacyAllocated:Number(o.legacy_allocated)}}));
      }
    }
    const mismatchCount=findings.length;
    const details={version:'V351.0.0',scope,merchantCount:merchants.rowCount,findingTypes:[...new Set(findings.map(f=>f.findingType))],findingCount:mismatchCount};
    const final=await tx.query<any>(`update trust_marketplace_reconciliation_runs set status='SUCCEEDED',checked_count=$2,mismatch_count=$3,details_json=$4::jsonb,completed_at=now() where id=$1 returning *`,[runId,merchants.rowCount,mismatchCount,JSON.stringify(details)]);
    return {run:final.rows[0],findings,replay:false};
  }catch(error){
    const code=error instanceof Error?error.message:'RECONCILIATION_FAILED';
    const failed=await tx.query<any>(`update trust_marketplace_reconciliation_runs set status='FAILED',error_code=$2,completed_at=now() where id=$1 returning *`,[runId,code]);
    throw Object.assign(new Error(code),{reconciliationRunId:runId,run:failed.rows[0]});
  }
}

export async function acknowledgeReconciliationFindingTx(tx:PoolClient,input:{findingId:string;actorId:string;idempotencyKey:string}){
  const r=await tx.query<any>('select * from trust_marketplace_reconciliation_findings where id=$1 for update',[input.findingId]);
  if(!r.rows[0])throw new Error('RECONCILIATION_FINDING_NOT_FOUND');
  if(r.rows[0].status==='RESOLVED')throw new Error('RECONCILIATION_FINDING_RESOLVED');
  const existing=await tx.query<any>('select id from trust_marketplace_reconciliation_finding_actions where idempotency_key=$1',[input.idempotencyKey]);
  if(existing.rows[0])return {findingId:input.findingId,status:'ACKNOWLEDGED',replay:true};
  await tx.query(`insert into trust_marketplace_reconciliation_finding_actions(finding_id,action,actor_id,note,idempotency_key) values($1,'ACKNOWLEDGE',$2,$3,$4)`,[input.findingId,input.actorId,'V351 finding acknowledged',input.idempotencyKey]);
  await tx.query(`update trust_marketplace_reconciliation_findings set status='ACKNOWLEDGED',updated_at=now() where id=$1`,[input.findingId]);
  return {findingId:input.findingId,status:'ACKNOWLEDGED',replay:false};
}
