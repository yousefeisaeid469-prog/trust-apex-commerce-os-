import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const env=process.env.DATABASE_URL||process.env.TRUST_DB_URL;
const required=[
  ['modules/commerce/inventory/transaction-engine.ts',['trust_inventory_transactions','reserveInventoryTransactionTx','releaseInventoryTransactionTx','shipInventoryTransactionTx','receiveInventoryTransactionTx']],
  ['modules/commerce/inventory/reservations.ts',['reserveInventoryTransactionTx','releaseInventoryTransactionTx']],
  ['modules/marketplace/fulfillment-inventory-execution.ts',['shipInventoryTransactionTx']],
  ['modules/marketplace/fulfillment-runtime.ts',['receiveInventoryTransactionTx']],
  ['modules/marketplace/fba-runtime.ts',['shipInventoryTransactionTx']],
];
const errors=[];
for(const [file,tokens] of required){const s=fs.readFileSync(path.join(root,file),'utf8');for(const t of tokens)if(!s.includes(t))errors.push(`${file}: missing ${t}`);}
const migration=fs.readFileSync(path.join(root,'db/migrations/227_v402_inventory_transaction_engine.sql'),'utf8');
for(const t of ['CREATE TABLE IF NOT EXISTS trust_inventory_transactions','idempotency_key text NOT NULL UNIQUE','RESERVE','RELEASE','SHIP','INBOUND'])if(!migration.includes(t))errors.push(`migration contract ${t}`);
if(errors.length){console.error(JSON.stringify({version:'V402.0.0',suite:'inventory-transaction-engine',status:'FAIL',errors},null,2));process.exit(1)}
if(!env){console.log(JSON.stringify({version:'V402.0.0',suite:'inventory-transaction-engine',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.'},null,2));process.exit(0)}
const { Client } = await import('pg');
const client=new Client({connectionString:env});
try{
 await client.connect();
 const table=await client.query(`select to_regclass('public.trust_inventory_transactions') as table_name`);
 if(!table.rows[0]?.table_name)throw new Error('TRUST_INVENTORY_TRANSACTIONS_TABLE_MISSING');
 const counts=await client.query(`select transaction_type,count(*)::int as count from trust_inventory_transactions group by transaction_type order by transaction_type`);
 const dup=await client.query(`select idempotency_key,count(*)::int as count from trust_inventory_transactions group by idempotency_key having count(*)>1 limit 1`);
 if(dup.rows.length)throw new Error('INVENTORY_TRANSACTION_IDEMPOTENCY_VIOLATION');
 console.log(JSON.stringify({version:'V402.0.0',suite:'inventory-transaction-engine',status:'PASS',transactionCounts:counts.rows},null,2));
} catch(e){console.error(JSON.stringify({version:'V402.0.0',suite:'inventory-transaction-engine',status:'FAIL',error:String(e?.message??e)},null,2));process.exitCode=1} finally {await client.end().catch(()=>{});}
