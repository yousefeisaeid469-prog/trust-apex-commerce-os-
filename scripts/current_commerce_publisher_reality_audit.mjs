import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[];
const ok=(name,condition,detail='')=>checks.push({name,pass:Boolean(condition),detail});
const publisher=read('modules/platform/commerce-events/publisher.ts');
const worker=read('scripts/commerce_event_publisher.mjs');
const route=read('app/api/cron/commerce-event-publisher/route.ts');
const health=read('app/api/health/commerce/route.ts');
const migration=read('db/migrations/195_v366_commerce_event_publisher_runtime.sql');
const vercel=JSON.parse(read('vercel.json'));

ok('durable publisher module exists', publisher.includes('runCommerceEventPublisher'));
ok('transactional claim uses SKIP LOCKED', publisher.includes('FOR UPDATE SKIP LOCKED'));
ok('stale processing recovery exists', publisher.includes("status='processing'") && publisher.includes("interval '2 minutes'"));
ok('bounded retry exists', publisher.includes('retryDelaySeconds') && publisher.includes('maxAttempts'));
ok('dead-letter state exists', migration.includes("status IN ('pending','processing','published','failed','dead')") && publisher.includes("status='dead'"));
ok('publisher run ledger exists', migration.includes('trust_commerce_event_publisher_runs'));
ok('publisher heartbeat exists', migration.includes('trust_commerce_event_publisher_heartbeat'));
ok('standalone worker uses runtime module', worker.includes("runCommerceEventPublisher"));
ok('cron endpoint is secret protected', route.includes('CRON_SECRET') && route.includes("Bearer ${expected}"));
ok('health exposes publisher state', health.includes('publisherStale') && health.includes('trust_commerce_event_publisher_heartbeat'));
ok('vercel publisher recovery cron exists', vercel.crons?.some(x=>x.path==='/api/cron/commerce-event-publisher' && /^\S+ \S+ \* \* \*$/.test(x.schedule)));

const files=fs.readdirSync(path.join(root,'db/migrations')).filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort();
const nums=files.map(f=>Number(f.slice(0,3)));
ok('migration sequence ends at 195', nums.at(-1)===195 && nums.every((n,i)=>n===i+1));
const hash=crypto.createHash('sha256').update(migration).digest('hex');
const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
ok('migration checksum is manifest-compatible', manifest.migrations?.find(x=>x.file==='195_v366_commerce_event_publisher_runtime.sql')?.checksum===hash);

const failures=checks.filter(x=>!x.pass);
console.log(`V366 CURRENT PUBLISHER REALITY AUDIT — ${checks.length-failures.length}/${checks.length} PASS`);
for(const c of checks) console.log(`${c.pass?'PASS':'FAIL'} — ${c.name}${c.detail?` — ${c.detail}`:''}`);
if(failures.length) process.exit(1);
