const limit = Math.max(1, Math.min(500, Number(process.env.COMMERCE_INTEGRITY_LIMIT ?? 100)));
const live = Boolean(process.env.DATABASE_URL || process.env.TRUST_DB_URL);

const requiredTables = [
  'trust_orders','trust_payments','trust_payment_events','trust_refunds',
  'trust_commerce_execution_runs','trust_commerce_execution_steps',
  'trust_marketplace_fulfillment_orders','trust_revenue_ledger','trust_outbox_events'
];

async function main(){
  if(!live){
    console.log(JSON.stringify({version:'V395.0.0',suite:'commerce-journey-integrity',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.'},null,2));
    return;
  }
  const { withPgTransaction, closePostgresPool } = await import('../modules/platform/db/postgres.ts');
  const result = await withPgTransaction(async client => {
    const tables = await client.query(`
      select table_name from information_schema.tables
      where table_schema='public' and table_name = any($1::text[])
    `,[requiredTables]);
    const present = new Set(tables.rows.map(r=>String(r.table_name)));
    const missing = requiredTables.filter(t=>!present.has(t));
    if(missing.length) return {status:'FAIL',reason:'REQUIRED_TABLES_MISSING',missing};

    const integrity = await client.query(`select violation,order_id,reference_id from trust_commerce_journey_integrity limit $1`,[limit]);
    const orphanPayments = await client.query(`
      select p.id payment_id,p.order_id from trust_payments p
      left join trust_orders o on o.id=p.order_id where o.id is null limit $1
    `,[limit]);
    const duplicateProviderEvents = await client.query(`
      select provider,provider_event_id,count(*)::int count
      from trust_payment_events group by provider,provider_event_id having count(*)>1 limit $1
    `,[limit]);
    const failedOutbox = await client.query(`
      select id,event_type,aggregate_id from trust_outbox_events
      where status='failed' and next_attempt_at <= now() limit $1
    `,[limit]);
    const capturedWithoutPaymentExecution = await client.query(`
      select p.id payment_id,p.order_id
      from trust_payments p
      left join trust_commerce_execution_runs r on r.order_id=p.order_id
      where p.status='captured' and r.id is null limit $1
    `,[limit]);

    const failures = {
      integrity: integrity.rows,
      orphanPayments: orphanPayments.rows,
      duplicateProviderEvents: duplicateProviderEvents.rows,
      capturedWithoutPaymentExecution: capturedWithoutPaymentExecution.rows,
      failedOutbox: failedOutbox.rows,
    };
    const violationCount = Object.values(failures).reduce((n, rows)=>n+rows.length,0);
    return {status:violationCount?'FAIL':'PASS',checked:{requiredTables:requiredTables.length,integrityRows:integrity.rowCount,orphanPayments:orphanPayments.rowCount,duplicateProviderEvents:duplicateProviderEvents.rowCount,capturedWithoutPaymentExecution:capturedWithoutPaymentExecution.rowCount},failures};
  });
  console.log(JSON.stringify({version:'V395.0.0',suite:'commerce-journey-integrity',...result},null,2));
  if(result.status==='FAIL') process.exitCode=2;
  await closePostgresPool();
}
await main();
