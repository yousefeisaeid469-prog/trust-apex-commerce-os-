import { expireInventoryReservationsTx } from '../modules/commerce/inventory/reservations.ts';
import { withPgTransaction, databaseConfigured } from '../modules/platform/db/postgres.ts';

const once = process.argv.includes('--once');
const batch = Number(process.env.TRUST_INVENTORY_EXPIRY_BATCH ?? 500);
const idleMs = Number(process.env.TRUST_INVENTORY_EXPIRY_IDLE_MS ?? 1000);

async function tick() {
  if (!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
  return withPgTransaction(client => expireInventoryReservationsTx(client, batch));
}

if (once) {
  console.log(JSON.stringify(await tick()));
  process.exit(0);
}

while (true) {
  const result = await tick();
  if (!result.expired) await new Promise(resolve => setTimeout(resolve, idleMs));
}
