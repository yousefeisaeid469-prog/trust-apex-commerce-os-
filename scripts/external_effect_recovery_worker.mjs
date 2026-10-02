import { withPgTransaction } from '../modules/platform/db/postgres.ts';
import { recoverExpiredExternalEffectsTx } from '../modules/platform/transaction-consistency.ts';
const limit = Number(process.env.EXTERNAL_EFFECT_RECOVERY_BATCH || 100);
if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('EXTERNAL_EFFECT_RECOVERY_BATCH_INVALID');
const recovered = await withPgTransaction(tx => recoverExpiredExternalEffectsTx(tx, limit));
console.log(JSON.stringify({ok:true,recovered:recovered.length,ids:recovered.map(x=>String(x.id))},null,2));
