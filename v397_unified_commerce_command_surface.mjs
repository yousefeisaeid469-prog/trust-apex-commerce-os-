const url=process.env.DATABASE_URL||process.env.TRUST_DB_URL;
if(!url){console.log(JSON.stringify({version:'V397.0.0',suite:'unified-commerce-command-surface',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify the live command snapshot.'},null,2));process.exit(0)}
const { createRequire } = await import('node:module'); const require=createRequire(import.meta.url); const {Client}=require('pg'); const c=new Client({connectionString:url});
try{await c.connect();
 const required=['trust_commerce_command_snapshot','trust_seller_settlement_truth','trust_orders','trust_seller_orders','trust_marketplace_fulfillment_orders','trust_marketplace_payment_settlements','trust_revenue_ledger'];
 const missing=[]; for(const t of required){const r=await c.query(`select to_regclass($1) as x`,[t]);if(!r.rows[0].x)missing.push(t)}
 if(missing.length){console.error(JSON.stringify({version:'V397.0.0',suite:'unified-commerce-command-surface',status:'FAIL',reason:'MISSING_AUTHORITIES',missing},null,2));process.exitCode=1}
 else {const r=await c.query(`select count(*)::int total,count(*) filter(where command_status<>'OK')::int findings,count(*) filter(where command_status='SELLER_SPLIT_TOTAL_MISMATCH')::int split_mismatch from trust_commerce_command_snapshot`);console.log(JSON.stringify({version:'V397.0.0',suite:'unified-commerce-command-surface',status:'LIVE',...r.rows[0]},null,2));}
}finally{await c.end().catch(()=>{})}
