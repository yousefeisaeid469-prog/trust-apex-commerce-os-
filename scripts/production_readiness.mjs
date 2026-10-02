import fs from 'node:fs';
import crypto from 'node:crypto';
import pg from 'pg';
const {Pool}=pg;
const failures=[],warnings=[];
const required=['DATABASE_URL','TRUST_SESSION_SECRET','TRUST_WEBHOOK_SECRET'];
for(const k of required) if(!process.env[k]) failures.push(`Missing production secret/config: ${k}`);
if(process.env.NODE_ENV==='production' && !process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) failures.push('NEXT_PUBLIC_APP_URL must be HTTPS in production');
const migrationDir='db/migrations'; const files=fs.readdirSync(migrationDir).filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort();
const nums=files.map(f=>Number(f.slice(0,3))); if(nums.some((n,i)=>n!==i+1)) failures.push(`Migration sequence is not contiguous: ${nums.join(',')}`);
if(files.length && fs.existsSync('db/migrations/MANIFEST.json')) { const m=JSON.parse(fs.readFileSync('db/migrations/MANIFEST.json','utf8')); for(const f of files){const x=m.migrations.find(v=>v.file===f); const c=crypto.createHash('sha256').update(fs.readFileSync(`${migrationDir}/${f}`)).digest('hex'); if(!x||x.checksum!==c) failures.push(`Migration manifest drift: ${f}`);} }
if(process.env.DATABASE_URL){ const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:4000}); try{const r=await pool.query(`select count(*)::int as pending from trust_outbox_events where status='pending' and available_at<=now()`); if(Number(r.rows[0]?.pending)>1000) warnings.push(`Pending outbox backlog is ${r.rows[0].pending}`); await pool.query('select 1 from trust_jobs limit 1');}catch(e){failures.push(`Database readiness check failed: ${e instanceof Error?e.message:'unknown'}`)}finally{await pool.end();} }
if(failures.length){console.error(`TRUST V132 production readiness FAILED (${failures.length})`); failures.forEach(x=>console.error('- '+x)); process.exit(1)}
console.log(`TRUST V132 production readiness PASS — ${files.length} canonical migrations verified.`); warnings.forEach(x=>console.log('WARN - '+x));
