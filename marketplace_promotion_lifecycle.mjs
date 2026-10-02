import { query } from '../modules/platform/db/postgres.ts';
await query(`select trust_sync_marketplace_promotion_lifecycle()`);
console.log('Marketplace promotion lifecycle sync PASS');
