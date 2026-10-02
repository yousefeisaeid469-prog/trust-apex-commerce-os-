import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
const version=read('lib/runtime/version.ts').match(/V(\d+\.\d+\.\d+)/)?.[1];
if(pkg.version!=='400.0.0'||version!=='400.0.0'||lock.version!=='400.0.0'||lock.packages?.['']?.version!=='400.0.0') errors.push('version integrity');
const head=manifest.migrations.at(-1); if(manifest.version!=='V400.0.0'||String(head?.id)!=='225'||head?.version!=='V400.0.0') errors.push('migration head');
for(const f of ['db/migrations/225_v400_global_sellable_catalog_truth.sql','scripts/v400_sellable_catalog_truth.mjs','modules/commerce/catalog/sellable-truth.ts','app/api/catalog/sellable/[productId]/route.ts','MASTER-RELEASE.md']) if(!exists(f)) errors.push('missing '+f);
const migration=read('db/migrations/225_v400_global_sellable_catalog_truth.sql'); for(const t of ['trust_sellable_catalog_truth','trust_products','trust_marketplace_catalog_items','trust_marketplace_offers','trust_product_variants','STOCK_TRUTH_CONFLICT']) if(!migration.includes(t)) errors.push('catalog contract '+t);
const verifier=read('scripts/v400_sellable_catalog_truth.mjs'); for(const t of ['DATABASE_NOT_CONFIGURED','trust_sellable_catalog_truth','ORPHAN_OFFERS']) if(!verifier.includes(t)) errors.push('verifier contract '+t);
const mod=read('modules/commerce/catalog/sellable-truth.ts'); for(const t of ['getSellableCatalogTruth','listSellableCatalogConflicts','LIVE_POSTGRES_SELLABLE_CATALOG_AUTHORITY']) if(!mod.includes(t)) errors.push('module contract '+t);
const sum=crypto.createHash('sha256').update(migration).digest('hex'); if(head?.checksum!==sum) errors.push('migration checksum mismatch');
if(errors.length){console.error('V400 RELEASE GATE FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('V400 RELEASE GATE PASS — product, catalog, offer, variant and stock truth are unified behind a PostgreSQL read authority.');
