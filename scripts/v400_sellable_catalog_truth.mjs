import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

if (!process.env.DATABASE_URL && !process.env.TRUST_DB_URL) {
  console.log(JSON.stringify({ version:'V400.0.0', suite:'sellable-catalog-truth', status:'SKIP', reason:'DATABASE_NOT_CONFIGURED', message:'Set DATABASE_URL/TRUST_DB_URL to verify a real PostgreSQL database.' }, null, 2));
  process.exit(0);
}

const { query } = await import('../modules/platform/db/postgres.ts');
const required = ['trust_products','trust_marketplace_catalog_items','trust_marketplace_offers','trust_product_variants'];
const tables = await query(`select table_name from information_schema.tables where table_schema='public' and table_name = any($1::text[])`, [required]);
const found = new Set(tables.rows.map(r => String(r.table_name)));
const missing = required.filter(t => !found.has(t));
if (missing.length) { console.error(JSON.stringify({ version:'V400.0.0', suite:'sellable-catalog-truth', status:'FAIL', reason:'MISSING_TABLES', missing }, null, 2)); process.exit(1); }
const conflicts = await query(`select sellable_status,count(*)::int as count from trust_sellable_catalog_truth where sellable_status <> 'SELLABLE' group by sellable_status order by sellable_status`);
const orphans = await query(`select count(*)::int as count from trust_marketplace_offers o left join trust_products p on p.id=o.product_id where p.id is null`);
const duplicateProductOffers = await query(`select count(*)::int as count from (select product_id from trust_marketplace_offers group by product_id having count(*) > 1) x`);
const result = { version:'V400.0.0', suite:'sellable-catalog-truth', status:'PASS', conflicts:conflicts.rows, orphanOffers:Number(orphans.rows[0]?.count ?? 0), productsWithMultipleOffers:Number(duplicateProductOffers.rows[0]?.count ?? 0) };
if (result.orphanOffers !== 0) { result.status='FAIL'; result.reason='ORPHAN_OFFERS'; }
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'PASS') process.exit(1);
