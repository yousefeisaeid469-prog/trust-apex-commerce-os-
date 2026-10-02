import process from 'node:process';

const databaseUrl = process.env.DATABASE_URL || process.env.TRUST_DB_URL;
if (!databaseUrl) {
  console.log(JSON.stringify({version:'V399.0.0',suite:'buyer-operating-truth',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.'},null,2));
  process.exit(0);
}
const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const required = ['trust_users','trust_carts','trust_cart_items','trust_orders','trust_returns','trust_customer_reviews','platform_notifications','trust_wishlists','trust_buyer_operating_snapshot','trust_commerce_command_snapshot'];
  const missing = (await client.query(`select table_name from information_schema.tables where table_schema='public' and table_name = any($1::text[])`,[required])).rows;
  const present = new Set(missing.map(r=>r.table_name));
  const absent = required.filter(x=>!present.has(x));
  if(absent.length) throw new Error(`MISSING_REQUIRED_RELATIONS:${absent.join(',')}`);
  const surface = await client.query(`select * from trust_buyer_operating_snapshot where customer_id is not null limit 1000`);
  const anomalies = surface.rows.filter(r => Number(r.cart_item_count)<0 || Number(r.order_count)<0 || Number(r.return_count)<0 || Number(r.unread_notification_count)<0);
  const authCheck = await client.query(`select count(*)::int as count from trust_buyer_operating_snapshot s left join trust_users u on u.id=s.customer_id where u.id is null`);
  const result={version:'V399.0.0',suite:'buyer-operating-truth',status: anomalies.length===0 && Number(authCheck.rows[0].count)===0 ? 'PASS':'FAIL',customersChecked:surface.rowCount,anomalies:anomalies.length,orphanSnapshots:Number(authCheck.rows[0].count)};
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='PASS') process.exitCode=1;
} finally { await client.end(); }
