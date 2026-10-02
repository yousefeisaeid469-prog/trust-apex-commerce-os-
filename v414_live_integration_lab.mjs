import { databaseConfigured, query, withPgTransaction } from '../modules/platform/db/postgres.ts';
import { ensureExternalEffectIntentTx, claimExternalEffectTx, recoverExpiredExternalEffectsTx } from '../modules/platform/transaction-consistency.ts';

if (!databaseConfigured()) {
  console.log('V414 LIVE INTEGRATION LAB SKIP — DATABASE_URL NOT CONFIGURED');
  process.exit(0);
}

const owner = `v414-lab-${process.pid}`;
const effectKey = `v414-live-lab:${process.pid}:${Date.now()}`;
let intentId = null;
try {
  const created = await withPgTransaction(async tx => {
    const ensured = await ensureExternalEffectIntentTx(tx, {
      scope: 'v414-live-lab',
      effectKey,
      provider: 'lab',
      request: { amount: 1, currency: 'TEST', key: effectKey },
    });
    await claimExternalEffectTx(tx, ensured.intent, owner, 1n);
    await tx.query(`update trust_external_effect_intents set lease_until=now()-interval '1 second' where id=$1`, [ensured.intent.id]);
    intentId = ensured.intent.id;
    return ensured.intent.id;
  });
  if (created !== intentId) throw new Error('V414_LAB_INTENT_ID_MISMATCH');

  const recovered = await withPgTransaction(tx => recoverExpiredExternalEffectsTx(tx, 10));
  if (!recovered.some(row => String(row.id) === String(intentId))) throw new Error('V414_LAB_RECOVERY_MISSED_INTENT');

  const row = (await query(`select status,last_error from trust_external_effect_intents where id=$1`, [intentId])).rows[0];
  if (!row || row.status !== 'FAILED' || row.last_error !== 'EXTERNAL_EFFECT_LEASE_EXPIRED') throw new Error('V414_LAB_RECOVERY_STATE_INVALID');
  await query(`delete from trust_external_effect_intents where id=$1`, [intentId]);
  console.log('V414 LIVE INTEGRATION LAB PASS — PostgreSQL claim → expired lease → fenced recovery verified');
} catch (error) {
  if (intentId) { try { await query(`delete from trust_external_effect_intents where id=$1`, [intentId]); } catch {} }
  console.error('V414 LIVE INTEGRATION LAB FAIL', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
