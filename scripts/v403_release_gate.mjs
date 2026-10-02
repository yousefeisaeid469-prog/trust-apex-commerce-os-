import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {execFileSync} from 'node:child_process';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
if(pkg.version!=='403.0.0'||lock.version!=='403.0.0'||lock.packages?.['']?.version!=='403.0.0') errors.push('version integrity');
const runtime=read('lib/runtime/version.ts'); for(const t of ["TRUST_RUNTIME_VERSION='V403.0.0'","TRUST_VERSION='V403.0.0'","TRUST_VERSION_NUMBER='V403.0.0'"]) if(!runtime.includes(t)) errors.push('runtime '+t);
const head=manifest.migrations.at(-1); if(manifest.version!=='V403.0.0'||String(head?.id)!=='228'||head?.version!=='V403.0.0') errors.push('migration head');
for(const f of ['db/migrations/228_v403_global_mutation_closure.sql','modules/commerce/inventory/transaction-engine.ts','scripts/v403_inventory_mutation_closure.mjs','scripts/v403_mutation_boundary_audit.mjs','MASTER-RELEASE.md']) if(!exists(f)) errors.push('missing '+f);
const migration=read('db/migrations/228_v403_global_mutation_closure.sql'); for(const t of ['trust_command_receipts','trust_command_receipts_idempotency_uq','trust_inventory_transactions']) if(!migration.includes(t)) errors.push('migration contract '+t);
const engine=read('modules/commerce/inventory/transaction-engine.ts'); for(const t of ['reserveInventoryTransactionTx','releaseInventoryTransactionTx','shipInventoryTransactionTx','receiveInventoryTransactionTx','adjustInventoryTransactionTx','returnInventoryTransactionTx','trust_command_receipts']) if(!engine.includes(t)) errors.push('engine contract '+t);
const sum=crypto.createHash('sha256').update(migration).digest('hex'); if(head?.checksum!==sum) errors.push('migration checksum mismatch');
try{execFileSync(process.execPath,['scripts/v403_inventory_mutation_closure.mjs'],{stdio:'pipe'});}catch(e){errors.push('inventory mutation closure failed');}
try{execFileSync(process.execPath,['scripts/v403_mutation_boundary_audit.mjs'],{stdio:'pipe'});}catch(e){errors.push('mutation boundary audit failed');}
if(errors.length){console.error('V403 RELEASE GATE FAILED');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('V403 RELEASE GATE PASS — global inventory mutations are closed behind the canonical transaction engine and command receipts.');
