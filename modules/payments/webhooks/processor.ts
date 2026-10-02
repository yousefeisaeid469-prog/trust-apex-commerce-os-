import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { verifyWebhook } from '../../platform/security/webhook-signature';

export async function processPaymentWebhook(db: SqlExecutor, input: {
  rawBody: string; signature: string | null; secret: string | undefined; provider: string; providerEventId: string;
  paymentIntentId: string; status: 'succeeded' | 'failed'; payload: unknown;
}) {
  if (!verifyWebhook(input.rawBody, input.signature, input.secret)) throw new Error('INVALID_WEBHOOK_SIGNATURE');
  return db.transaction(async (tx) => {
    const inserted = await tx.query<{ id: string }>(
      `insert into trust_payment_events(provider,provider_event_id,payment_intent_id,status,payload_json) values($1,$2,$3,$4,$5::jsonb) on conflict(provider,provider_event_id) do nothing returning id`,
      [input.provider,input.providerEventId,input.paymentIntentId,input.status,JSON.stringify(input.payload)],
    );
    if (!inserted.rows[0]) { const duplicate = await tx.query<{ id: string }>('select id from trust_payment_events where provider=$1 and provider_event_id=$2', [input.provider,input.providerEventId]); return { duplicate: true, eventId: duplicate.rows[0]?.id ?? input.providerEventId }; }
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`,
      [input.status === 'succeeded' ? 'payment.succeeded' : 'payment.failed', input.paymentIntentId, JSON.stringify(input.payload)]);
    return { duplicate: false, eventId: inserted.rows[0].id };
  });
}
