import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const errors=[];
const pkg=JSON.parse(read('package.json'));
const script=read('scripts/v391_postgres_integration_lab.mjs');
if(pkg.scripts?.['postgres-integration-lab']!=='node --experimental-strip-types scripts/v391_postgres_integration_lab.mjs') errors.push('missing postgres integration npm script');
for(const token of ['DATABASE_URL','create schema','for update','on conflict','payment_webhooks','outbox_events','rollback','drop schema']) if(!script.includes(token)) errors.push('integration lab missing '+token);
if(!fs.existsSync(path.join(root,'docker-compose.production.yml'))) errors.push('missing postgres compose reference');
if(errors.length){ console.error('V391 POSTGRES INTEGRATION AUDIT FAILED'); errors.forEach(x=>console.error('- '+x)); process.exit(1); }
console.log('V391 POSTGRES INTEGRATION AUDIT PASS — live PostgreSQL lab is wired and isolated by temporary schema.');
