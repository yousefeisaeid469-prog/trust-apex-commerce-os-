import { withPgTransaction, closePostgresPool } from '../modules/platform/db/postgres.ts';
import { recoverExpiredExternalEffectsTx } from '../modules/platform/transaction-consistency.ts';

const batch = Number(process.env.EXTERNAL_EFFECT_RECOVERY_BATCH || 100);
const intervalMs = Number(process.env.EXTERNAL_EFFECT_RECOVERY_INTERVAL_MS || 5000);
if (!Number.isInteger(batch) || batch < 1 || batch > 500) throw new Error('EXTERNAL_EFFECT_RECOVERY_BATCH_INVALID');
if (!Number.isInteger(intervalMs) || intervalMs < 1000 || intervalMs > 300000) throw new Error('EXTERNAL_EFFECT_RECOVERY_INTERVAL_INVALID');

let stopping = false;
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => { stopping = true; });
while (!stopping) {
  try {
    const recovered = await withPgTransaction(tx => recoverExpiredExternalEffectsTx(tx, batch));
    if (recovered.length) console.log(JSON.stringify({ok:true,recovered:recovered.length,ids:recovered.map(x=>String(x.id))}));
  } catch (error) {
    console.error(JSON.stringify({ok:false,error:error instanceof Error?error.message:String(error)}));
  }
  await new Promise(resolve => setTimeout(resolve, intervalMs));
}
await closePostgresPool();
