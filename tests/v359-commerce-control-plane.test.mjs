import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(fs.readFileSync(`${root}/package.json`,'utf8'));
const ver = fs.readFileSync(`${root}/lib/runtime/version.ts`,'utf8');
const migration = fs.readFileSync(`${root}/db/migrations/189_v359_commerce_control_plane.sql`,'utf8');
const manifest = JSON.parse(fs.readFileSync(`${root}/db/migrations/MANIFEST.json`,'utf8'));
const worker = fs.readFileSync(`${root}/modules/commerce/core/execution-worker.ts`,'utf8');
const cron = fs.readFileSync(`${root}/app/api/cron/commerce-execution-worker/route.ts`,'utf8');
const health = fs.readFileSync(`${root}/app/api/health/commerce/route.ts`,'utf8');

test('V359 version and migration are canonical', () => {
  assert.equal(pkg.version,'359.0.0');
  assert.match(ver,/V359\.0\.0/);
  assert.equal(manifest.version,'V359.0.0');
  assert.equal(manifest.generatedFor,'V359.0.0');
  const entry=manifest.migrations.find(x=>x.id==='189');
  assert.ok(entry);
  assert.equal(entry.file,'189_v359_commerce_control_plane.sql');
  const digest=crypto.createHash('sha256').update(migration).digest('hex');
  assert.equal(entry.checksum,digest);
});

test('V359 has durable worker run + heartbeat runtime', () => {
  assert.match(migration,/trust_commerce_worker_runs/);
  assert.match(migration,/trust_commerce_worker_heartbeat/);
  assert.match(worker,/startCommerceWorkerRun/);
  assert.match(worker,/finishCommerceWorkerRun/);
  assert.match(cron,/startCommerceWorkerRun/);
  assert.match(cron,/finishCommerceWorkerRun/);
  assert.match(health,/trust_commerce_execution_jobs/);
  assert.match(health,/trust_commerce_worker_heartbeat/);
});
