import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
const version=read('lib/runtime/version.ts').match(/V(\d+\.\d+\.\d+)/)?.[1];
if(pkg.version!=='401.0.0'||version!=='401.0.0'||lock.version!=='401.0.0'||lock.packages?.['']?.version!=='401.0.0') errors.push('version integrity');
const head=manifest.migrations.at(-1); if(manifest.version!=='V401.0.0'||String(head?.id)!=='226'||head?.version!=='V401.0.0') errors.push('migration head');
for(const f of ['db/migrations/226_v401_global_inventory_execution_truth.sql','scripts/v401_inventory_execution_truth.mjs','modules/commerce/inventory/execution-truth.ts','app/api/inventory/execution/[productId]/route.ts','MASTER-RELEASE.md']) if(!exists(f)) errors.push('missing '+f);
const migration=read('db/migrations/226_v401_global_inventory_execution_truth.sql'); for(const t of ['trust_inventory_execution_truth','trust_fulfillment_inventory','trust_inventory_reservations','trust_fulfillment_allocations','trust_marketplace_inventory_movements','RETURN_RECEIPT','canonical_available_units']) if(!migration.includes(t)) errors.push('inventory contract '+t);
const mod=read('modules/commerce/inventory/execution-truth.ts'); for(const t of ['getInventoryExecutionTruth','listInventoryExecutionConflicts','LIVE_POSTGRES_INVENTORY_EXECUTION_AUTHORITY']) if(!mod.includes(t)) errors.push('module contract '+t);
const verifier=read('scripts/v401_inventory_execution_truth.mjs'); for(const t of ['DATABASE_NOT_CONFIGURED','trust_inventory_execution_truth','invariantViolations']) if(!verifier.includes(t)) errors.push('verifier contract '+t);
const sum=crypto.createHash('sha256').update(migration).digest('hex'); if(head?.checksum!==sum) errors.push('migration checksum mismatch');
if(errors.length){console.error('V401 RELEASE GATE FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('V401 RELEASE GATE PASS — inventory execution has one PostgreSQL read authority across warehouse buckets, reservations, fulfillment allocation and shipment/return movements.');
