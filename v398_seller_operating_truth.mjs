const configured=Boolean(process.env.DATABASE_URL||process.env.TRUST_DB_URL);
if(!configured){
  console.log(JSON.stringify({version:'V398.0.0',suite:'seller-operating-truth',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.'},null,2));
  process.exit(0);
}
const {query}=await import('../modules/platform/db/postgres.ts');
const required=['trust_global_seller_operating_truth','trust_seller_settlement_truth','trust_seller_orders','trust_products','trust_merchant_inventory_balances','trust_marketplace_fulfillment_orders'];
const missing=[];
for(const table of required){const r=await query(`select to_regclass($1) as name`,[table]);if(!r.rows[0]?.name)missing.push(table)}
if(missing.length){console.error(JSON.stringify({version:'V398.0.0',suite:'seller-operating-truth',status:'FAIL',reason:'REQUIRED_RELATION_MISSING',missing},null,2));process.exit(1)}
const r=await query(`select operating_status,count(*)::int count from trust_global_seller_operating_truth group by operating_status order by operating_status`);
const truth=await query(`select truth_status,count(*)::int count from trust_seller_settlement_truth group by truth_status order by truth_status`);
const orphan=await query(`select count(*)::int count from trust_marketplace_fulfillment_orders f left join trust_seller_orders so on so.id=f.seller_order_id where f.seller_order_id is not null and so.id is null`);
const mismatch=await query(`select count(*)::int count from trust_global_seller_operating_truth where financial_exception_count>0 or fulfillment_exception_count>0 or exception_order_count>0`);
const status=mismatch.rows[0].count>0?'FAIL':'PASS';
console.log(JSON.stringify({version:'V398.0.0',suite:'seller-operating-truth',status,operatingStatuses:r.rows,settlementTruth:truth.rows,orphanFulfillmentOrders:orphan.rows[0].count,merchantsWithExceptions:mismatch.rows[0].count},null,2));
process.exit(status==='PASS'?0:2);
