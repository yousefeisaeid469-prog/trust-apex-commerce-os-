import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const dbUrl=process.env.DATABASE_URL||process.env.TRUST_DB_URL;

if(!dbUrl){
  console.log(JSON.stringify({version:'V396.0.0',suite:'seller-settlement-truth',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.'},null,2));
  process.exit(0);
}

const {Client}=await import('pg');
const client=new Client({connectionString:dbUrl});
const money=n=>Number(Number(n||0).toFixed(2));
const findings=[];
try{
  await client.connect();
  const required=['trust_orders','trust_seller_orders','trust_order_items','trust_seller_order_financials','trust_marketplace_payment_settlements','trust_marketplace_fee_ledger','trust_marketplace_payment_ledger','trust_seller_return_refund_allocations','trust_marketplace_payout_eligibility_allocations','trust_seller_order_payout_allocations'];
  for(const table of required){
    const r=await client.query(`select to_regclass($1) as relation`,[`public.${table}`]);
    if(!r.rows[0]?.relation) findings.push({type:'MISSING_TABLE',table});
  }
  const view=await client.query(`select to_regclass('public.trust_seller_settlement_truth') as relation`);
  if(!view.rows[0]?.relation) findings.push({type:'MISSING_VIEW',view:'trust_seller_settlement_truth'});
  if(!findings.length){
    const counts=await client.query(`select truth_status,count(*)::int count from trust_seller_settlement_truth group by truth_status order by truth_status`);
    for(const row of counts.rows){ if(row.truth_status!=='OK') findings.push({type:'TRUTH_STATUS',status:row.truth_status,count:row.count}); }
    const totals=await client.query(`
      select
        count(*)::int seller_orders,
        coalesce(sum(so.total),0)::numeric seller_order_total,
        coalesce((select sum(o.total) from trust_orders o where exists(select 1 from trust_seller_orders x where x.order_id=o.id)),0)::numeric aggregate_order_total,
        coalesce(sum(case when sf.seller_order_id is null then 1 else 0 end),0)::int financials_missing,
        coalesce(sum(case when sf.seller_order_id is not null and abs(so.total-(sf.seller_credit_amount+sf.platform_fee_amount+sf.payment_fee_amount+sf.fulfillment_fee_amount+sf.return_fee_amount))>0.01 then 1 else 0 end),0)::int unbalanced_financials
      from trust_seller_orders so left join trust_seller_order_financials sf on sf.seller_order_id=so.id`);
    const t=totals.rows[0];
    if(Number(t.financials_missing)>0) findings.push({type:'FINANCIALS_MISSING',count:Number(t.financials_missing)});
    if(Number(t.unbalanced_financials)>0) findings.push({type:'UNBALANCED_FINANCIALS',count:Number(t.unbalanced_financials)});
    const duplicateEvents=await client.query(`select merchant_id,order_id,count(*)::int count from trust_seller_orders group by merchant_id,order_id having count(*)>1`);
    if(duplicateEvents.rowCount) findings.push({type:'DUPLICATE_SELLER_ORDER_KEYS',count:duplicateEvents.rowCount});
    const payoutOver=await client.query(`select count(*)::int count from trust_seller_settlement_truth where truth_status='PAYOUT_OVERALLOCATED'`);
    if(Number(payoutOver.rows[0]?.count)>0) findings.push({type:'PAYOUT_OVERALLOCATED',count:Number(payoutOver.rows[0].count)});
    const feeDup=await client.query(`select merchant_id,idempotency_key,count(*)::int count from trust_marketplace_fee_ledger group by merchant_id,idempotency_key having count(*)>1`);
    if(feeDup.rowCount) findings.push({type:'DUPLICATE_FEE_LEDGER_KEYS',count:feeDup.rowCount});
    console.log(JSON.stringify({version:'V396.0.0',suite:'seller-settlement-truth',status:findings.length?'FAIL':'PASS',sellerOrders:Number(t.seller_orders),sellerOrderTotal:money(t.seller_order_total),aggregateOrderTotal:money(t.aggregate_order_total),financialsMissing:Number(t.financials_missing),unbalancedFinancials:Number(t.unbalanced_financials),findings},null,2));
    process.exitCode=findings.length?1:0;
  }else{
    console.log(JSON.stringify({version:'V396.0.0',suite:'seller-settlement-truth',status:'FAIL',findings},null,2));
    process.exitCode=1;
  }
}finally{ await client.end().catch(()=>{}); }
