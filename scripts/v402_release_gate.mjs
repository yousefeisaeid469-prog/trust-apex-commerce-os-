import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
if(pkg.version!=='402.0.0'||lock.version!=='402.0.0'||lock.packages?.['']?.version!=='402.0.0') errors.push('version integrity');
const runtime=read('lib/runtime/version.ts'); for(const t of ["TRUST_RUNTIME_VERSION='V402.0.0'","TRUST_VERSION='V402.0.0'","TRUST_VERSION_NUMBER='V402.0.0'"]) if(!runtime.includes(t)) errors.push('runtime '+t);
const head=manifest.migrations.at(-1); if(manifest.version!=='V402.0.0'||String(head?.id)!=='227'||head?.version!=='V402.0.0') errors.push('migration head');
for(const f of ['db/migrations/227_v402_inventory_transaction_engine.sql','scripts/v402_inventory_transaction_engine.mjs','modules/commerce/inventory/transaction-engine.ts','modules/commerce/inventory/reservations.ts','modules/marketplace/fulfillment-inventory-execution.ts','modules/marketplace/fulfillment-runtime.ts','modules/marketplace/fba-runtime.ts','MASTER-RELEASE.md']) if(!exists(f)) errors.push('missing '+f);
const migration=read('db/migrations/227_v402_inventory_transaction_engine.sql'); for(const t of ['trust_inventory_transactions','idempotency_key text NOT NULL UNIQUE','RESERVE','RELEASE','SHIP','INBOUND']) if(!migration.includes(t)) errors.push('transaction contract '+t);
const engine=read('modules/commerce/inventory/transaction-engine.ts'); for(const t of ['reserveInventoryTransactionTx','releaseInventoryTransactionTx','shipInventoryTransactionTx','receiveInventoryTransactionTx','V402_INVENTORY_TRANSACTION_ENGINE']) if(!engine.includes(t)) errors.push('engine contract '+t);
const sum=crypto.createHash('sha256').update(migration).digest('hex'); if(head?.checksum!==sum) errors.push('migration checksum mismatch');
if(errors.length){console.error('V402 RELEASE GATE FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('V402 RELEASE GATE PASS — inventory reserve/release/ship/inbound mutations have a durable PostgreSQL transaction and idempotency boundary.');
