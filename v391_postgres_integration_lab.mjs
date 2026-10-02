import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(JSON.stringify({version:'V391.0.0',suite:'postgres-integration-lab',status:'SKIP',reason:'DATABASE_URL is required; no live PostgreSQL endpoint was provided.'},null,2));
  process.exit(2);
}

const { default: pg } = await import('pg');
const { Pool } = pg;
const pool = new Pool({connectionString: databaseUrl, max: 8, connectionTimeoutMillis: 5000});
const schema = `trust_v391_lab_${crypto.randomBytes(6).toString('hex')}`;
const q = (text, values=[]) => pool.query(text, values);
const results = [];
const scenario = async (name, fn) => { await fn(); results.push({name,status:'PASS'}); };

try {
  await q(`create schema ${schema}`);
  await q(`set search_path to ${schema}, public`);
  await q(`
    create table inventory(item_id text primary key, available integer not null check (available >= 0));
    create table api_idempotency(scope text not null, idempotency_key text not null, status text not null, response_json jsonb, primary key(scope,idempotency_key));
    create table payment_webhooks(provider text not null, event_id text not null, received_at timestamptz not null default now(), primary key(provider,event_id));
    create table outbox_events(id bigserial primary key, event_type text not null, aggregate_id text not null, dedupe_key text unique, payload_json jsonb not null, created_at timestamptz not null default now());
    create table settlements(order_id text primary key, status text not null, amount integer not null check(amount >= 0));
    insert into inventory values ('sku-1', 1);
  `);

  await scenario('inventory-race-single-winner', async () => {
    const attempt = async () => {
      const c = await pool.connect();
      try {
        await c.query('begin');
        const row = (await c.query('select available from inventory where item_id=$1 for update', ['sku-1'])).rows[0];
        if (row.available < 1) { await c.query('rollback'); return false; }
        await c.query('update inventory set available=available-1 where item_id=$1', ['sku-1']);
        await c.query('commit');
        return true;
      } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
    };
    const [a,b] = await Promise.all([attempt(), attempt()]);
    assert.equal([a,b].filter(Boolean).length, 1);
    assert.equal((await q('select available from inventory where item_id=$1',['sku-1'])).rows[0].available, 0);
  });

  await scenario('idempotency-replay-one-record', async () => {
    const key = 'checkout:order-1';
    const insert = async () => q(`insert into api_idempotency(scope,idempotency_key,status,response_json) values($1,$2,'COMPLETED',$3) on conflict(scope,idempotency_key) do nothing`, ['checkout', key, JSON.stringify({orderId:'order-1'})]);
    await Promise.all([insert(), insert(), insert(), insert()]);
    assert.equal(Number((await q('select count(*) from api_idempotency where scope=$1 and idempotency_key=$2',['checkout',key])).rows[0].count), 1);
  });

  await scenario('payment-webhook-replay', async () => {
    const insert = () => q(`insert into payment_webhooks(provider,event_id) values($1,$2) on conflict(provider,event_id) do nothing`, ['provider-a','evt-1']);
    await Promise.all([insert(),insert(),insert()]);
    assert.equal(Number((await q('select count(*) from payment_webhooks where provider=$1 and event_id=$2',['provider-a','evt-1'])).rows[0].count), 1);
  });

  await scenario('outbox-dedupe', async () => {
    await q(`insert into outbox_events(event_type,aggregate_id,dedupe_key,payload_json) values($1,$2,$3,$4) on conflict(dedupe_key) do nothing`, ['order.created','order-1','order-created:order-1',JSON.stringify({orderId:'order-1'})]);
    await q(`insert into outbox_events(event_type,aggregate_id,dedupe_key,payload_json) values($1,$2,$3,$4) on conflict(dedupe_key) do nothing`, ['order.created','order-1','order-created:order-1',JSON.stringify({orderId:'order-1'})]);
    assert.equal(Number((await q('select count(*) from outbox_events where dedupe_key=$1',['order-created:order-1'])).rows[0].count), 1);
  });

  await scenario('settlement-rollback-and-retry', async () => {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query(`insert into settlements(order_id,status,amount) values($1,'RELEASING',100)`,['order-2']);
      await c.query('rollback');
    } finally { c.release(); }
    assert.equal(Number((await q('select count(*) from settlements where order_id=$1',['order-2'])).rows[0].count), 0);
    await q(`insert into settlements(order_id,status,amount) values($1,'RELEASED',100)`,['order-2']);
    await q(`insert into settlements(order_id,status,amount) values($1,'RELEASED',100) on conflict(order_id) do nothing`,['order-2']);
    assert.equal(Number((await q('select count(*) from settlements where order_id=$1',['order-2'])).rows[0].count), 1);
  });

  console.log(JSON.stringify({version:'V391.0.0',suite:'postgres-integration-lab',status:'PASS',schema,scenarios:results.length,results},null,2));
} catch (error) {
  console.error(JSON.stringify({version:'V391.0.0',suite:'postgres-integration-lab',status:'FAIL',schema,error:String(error?.stack||error)},null,2));
  process.exitCode = 1;
} finally {
  try { await q(`drop schema if exists ${schema} cascade`); } catch {}
  await pool.end();
}
