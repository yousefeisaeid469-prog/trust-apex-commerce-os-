import fs from 'node:fs';
const root=process.cwd();
const hasDb=Boolean(process.env.DATABASE_URL||process.env.TRUST_DB_URL);
if(!hasDb){console.log(JSON.stringify({version:'V401.0.0',suite:'inventory-execution-truth',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.'},null,2));process.exit(0)}
const pg=await import('pg');
const pool=new pg.default.Pool({connectionString:process.env.DATABASE_URL||process.env.TRUST_DB_URL});
try{
  const required=['trust_inventory_execution_truth','trust_fulfillment_inventory','trust_inventory_reservations','trust_fulfillment_allocations','trust_fulfillment_inventory_executions'];
  for(const name of required){const r=await pool.query(`select to_regclass($1) as rel`,[name]);if(!r.rows[0]?.rel)throw new Error(`MISSING_RELATION:${name}`)}
  const conflicts=await pool.query(`select execution_status,count(*)::int count from trust_inventory_execution_truth where execution_status not in ('AVAILABLE','OUT_OF_STOCK') group by execution_status order by execution_status`);
  const invariant=await pool.query(`select count(*)::int count from trust_inventory_execution_truth where location_count>0 and available_units+warehouse_reserved_units<>on_hand_units`);
  console.log(JSON.stringify({version:'V401.0.0',suite:'inventory-execution-truth',status:'PASS',conflicts:conflicts.rows,invariantViolations:Number(invariant.rows[0].count)},null,2));
}finally{await pool.end()}
