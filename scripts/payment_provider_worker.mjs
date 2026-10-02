import { query, withPgTransaction } from '../modules/platform/db/postgres.ts';
import { getPaymentProvider } from '../modules/platform/payment-providers/registry.ts';
import { applyPaymentEvent, applyRefundEvent } from '../modules/commerce/payments/orchestrator.ts';
import { applyPayoutProviderEvent } from '../modules/platform/v323/financial-close.ts';
import { ensureExternalEffectIntentTx, claimExternalEffectTx, completeExternalEffectTx, failExternalEffectTx } from '../modules/platform/transaction-consistency.ts';

const limit = Number(process.env.PAYMENT_RECONCILIATION_BATCH || 50);
if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('PAYMENT_RECONCILIATION_BATCH_INVALID');

async function claim() {
  return (await query(`with candidates as (select id from trust_payment_provider_jobs where status in ('PENDING','PROCESSING') and available_at<=now() and (lease_until is null or lease_until<now()) order by available_at asc for update skip locked limit $1) update trust_payment_provider_jobs j set status='PROCESSING',lease_until=now()+interval '2 minutes',attempts=j.attempts+1,updated_at=now() from candidates c where j.id=c.id returning j.id,j.kind,j.payment_id,j.refund_id,j.provider,j.attempts`, [limit])).rows;
}

const jobs = await claim();
const results = [];
const effectOwner = process.env.TRUST_PAYMENT_PROVIDER_WORKER_ID ?? `payment-provider-${process.pid}`;
async function claimEffect(scope, effectKey, request, provider) {
  return withPgTransaction(async tx => {
    const ensured = await ensureExternalEffectIntentTx(tx, { scope, effectKey, request, provider });
    if (ensured.intent.status === 'SUCCEEDED' && ensured.intent.responseJson) return { replay: true, intent: ensured.intent };
    await claimExternalEffectTx(tx, ensured.intent, effectOwner);
    return { replay: false, intent: ensured.intent };
  });
}
for (const job of jobs) {
  let activeEffect = null;
  try {
    if (job.kind === 'CREATE_PAYMENT') {
      const row = (await query(`select p.id,p.order_id,p.payment_intent_id,p.amount,p.currency,p.idempotency_key,u.id customer_id from trust_payments p join trust_orders o on o.id=p.order_id left join trust_users u on u.id=o.customer_id where p.id=$1`, [job.payment_id])).rows[0];
      if (!row) throw new Error('PAYMENT_NOT_FOUND');
      const effect = await claimEffect('payment-provider-create', `payment:${row.idempotency_key}`, { paymentId: row.id, orderId: String(row.order_id), amount: Number(row.amount), currency: String(row.currency), customerId: String(row.customer_id ?? ''), idempotencyKey: String(row.idempotency_key) }, job.provider);
      activeEffect = effect;
      const external = effect.replay ? effect.intent.responseJson : await getPaymentProvider(job.provider).createPayment({paymentId: row.id,orderId: String(row.order_id),amount:Number(row.amount),currency:String(row.currency),customerId:String(row.customer_id ?? ''),idempotencyKey:String(row.idempotency_key)});
      if (!external) throw new Error('PAYMENT_PROVIDER_EFFECT_RESULT_MISSING');
      await withPgTransaction(async tx => {
        if (!effect.replay) await completeExternalEffectTx(tx, effect.intent.id, effectOwner, { providerReference: external.providerReference ?? null, response: external });
        await tx.query(`update trust_payments set provider_reference=$2,updated_at=now() where id=$1`, [row.id, external.providerReference]);
        await tx.query(`update trust_global_payment_attempts set client_secret=coalesce($2,client_secret),provider_reference=coalesce($3,provider_reference),updated_at=now() where payment_id=$1`, [row.id, external.clientSecret ?? null, external.providerReference ?? null]);
        await tx.query(`update trust_payment_provider_jobs set status='DONE',lease_until=null,last_error=null,provider_reference=$2,updated_at=now() where id=$1`, [job.id, external.providerReference]);
      });
      await withPgTransaction(tx => applyPaymentEvent(tx,{provider:job.provider,eventId:`provider-create:${job.id}:${external.providerReference}`,paymentIntentId:String(row.payment_intent_id),status:external.status,payload:external.raw}));
      results.push({ok:true,jobId:job.id,kind:job.kind,status:external.status,providerReference:external.providerReference});
    } else if (job.kind === 'REFUND') {
      const row = (await query(`select r.id refund_id,r.payment_id,r.amount,r.reason,r.idempotency_key,p.provider,p.provider_reference,p.currency from trust_refunds r join trust_payments p on p.id=r.payment_id where r.id=$1`, [job.refund_id])).rows[0];
      if (!row) throw new Error('REFUND_NOT_FOUND');
      if (!row.provider_reference) throw new Error('PAYMENT_PROVIDER_REFERENCE_REQUIRED');
      const effect = await claimEffect('payment-provider-refund', `refund:${row.idempotency_key}`, { refundId: row.refund_id, providerReference: String(row.provider_reference), amount: Number(row.amount), currency: String(row.currency), reason: row.reason ? String(row.reason) : null, idempotencyKey: String(row.idempotency_key) }, job.provider);
      activeEffect = effect;
      const external = effect.replay ? effect.intent.responseJson : await getPaymentProvider(job.provider).refund({refundId:row.refund_id,providerReference:String(row.provider_reference),amount:Number(row.amount),currency:String(row.currency),reason:row.reason ? String(row.reason) : undefined,idempotencyKey:String(row.idempotency_key)});
      if (!external) throw new Error('PAYMENT_PROVIDER_EFFECT_RESULT_MISSING');
      await withPgTransaction(async tx => {
        if (!effect.replay) await completeExternalEffectTx(tx, effect.intent.id, effectOwner, { providerReference: external.providerReference ?? null, response: external });
        await tx.query(`update trust_refunds set status=$2,provider_reference=coalesce($3,provider_reference),updated_at=now() where id=$1`, [row.refund_id,external.status === 'processing' ? 'processing' : external.status,external.providerReference ?? null]);
        await tx.query(`update trust_payment_provider_jobs set status=$2,lease_until=null,last_error=null,provider_reference=coalesce($3,provider_reference),updated_at=now() where id=$1`, [job.id,external.status === 'processing' ? 'PENDING' : 'DONE',external.providerReference ?? null]);
      });
      if (external.status !== 'processing') await withPgTransaction(tx => applyRefundEvent(tx,{provider:job.provider,eventId:`provider-refund:${job.id}:${external.providerReference ?? 'none'}`,refundId:row.refund_id,status:external.status,providerReference:external.providerReference,payload:external.raw}));
      results.push({ok:true,jobId:job.id,kind:job.kind,status:external.status,providerReference:external.providerReference});
    } else if (job.kind === 'PAYOUT') {
      const row = (await query(`select p.id payout_id,p.amount,p.currency,p.provider,p.provider_account_ref,p.status,p.provider_reference,m.external_account_ref,m.status account_status,m.currency account_currency from trust_marketplace_payout_requests p left join trust_merchant_payout_accounts m on m.merchant_id=p.merchant_id and m.provider=p.provider where p.id=$1`, [job.payout_id])).rows[0];
      if (!row) throw new Error('PAYOUT_NOT_FOUND');
      if (!row.provider) throw new Error('PAYOUT_PROVIDER_REQUIRED');
      if (row.account_status && row.account_status !== 'ACTIVE') throw new Error('PAYOUT_ACCOUNT_NOT_ACTIVE');
      if (row.account_currency && String(row.account_currency) !== String(row.currency)) throw new Error('PAYOUT_ACCOUNT_CURRENCY_MISMATCH');
      if (!row.external_account_ref && !row.provider_account_ref) throw new Error('PAYOUT_DESTINATION_REQUIRED');
      const destinationRef=String(row.provider_account_ref ?? row.external_account_ref);
      const attemptNo=Number(job.attempts);
      if (!Number.isInteger(attemptNo) || attemptNo<1) throw new Error('PAYOUT_ATTEMPT_INVALID');
      const attemptKey=`payout-attempt:${row.payout_id}:${attemptNo}`;
      await withPgTransaction(async tx=>{ await tx.query(`insert into trust_marketplace_payout_provider_attempts(payout_id,provider,idempotency_key,attempt_no,status) values($1,$2,$3,$4,'PROCESSING') on conflict(idempotency_key) do nothing`,[row.payout_id,job.provider,attemptKey,attemptNo]); });
      const effect = await claimEffect('payment-provider-payout', `payout:${attemptKey}`, { payoutId:String(row.payout_id), amount:Number(row.amount), currency:String(row.currency), destinationRef, idempotencyKey:attemptKey }, job.provider);
      activeEffect = effect;
      const external = effect.replay ? effect.intent.responseJson : await getPaymentProvider(job.provider).createPayout({payoutId:String(row.payout_id),amount:Number(row.amount),currency:String(row.currency),destinationRef,idempotencyKey:attemptKey});
      if (!external) throw new Error('PAYOUT_PROVIDER_EFFECT_RESULT_MISSING');
      await withPgTransaction(async tx => {
        if (!effect.replay) await completeExternalEffectTx(tx, effect.intent.id, effectOwner, { providerReference: external.providerReference ?? null, response: external });
        await tx.query(`update trust_marketplace_payout_provider_attempts set status=$2,provider_reference=$3,raw_response_json=$4::jsonb,updated_at=now() where payout_id=$1 and attempt_no=$5`,[row.payout_id,external.status==='succeeded'?'SUCCEEDED':external.status==='failed'?'FAILED':'PROCESSING',external.providerReference,JSON.stringify(external.raw??{}),attemptNo]);
        await tx.query(`update trust_payment_provider_jobs set status=$2,lease_until=null,last_error=null,provider_reference=$3,updated_at=now() where id=$1`,[job.id,external.status==='processing'?'PENDING':'DONE',external.providerReference]);
      });
      await withPgTransaction(tx=>applyPayoutProviderEvent({payoutId:String(row.payout_id),status:external.status==='succeeded'?'PAID':external.status==='failed'?'FAILED':'PROCESSING',providerReference:external.providerReference,idempotencyKey:`payout-event:${job.id}:${external.providerReference}`}));
      results.push({ok:true,jobId:job.id,kind:job.kind,status:external.status,providerReference:external.providerReference});
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'PAYMENT_PROVIDER_EXECUTION_FAILED';
    const terminal = Number(job.attempts) >= 5;
    if (activeEffect && !activeEffect.replay) {
      try {
        await withPgTransaction(tx => failExternalEffectTx(tx, activeEffect.intent.id, effectOwner, reason, terminal ? 900 : 30));
      } catch (effectError) {
        results.push({ok:false,jobId:job.id,kind:job.kind,error:reason,effectFailure:effectError instanceof Error?effectError.message:String(effectError)});
      }
    }
    await query(`update trust_payment_provider_jobs set status=$2,lease_until=null,last_error=$3,available_at=case when $2='FAILED' then now()+interval '15 minutes' else now()+interval '30 seconds' end,updated_at=now() where id=$1`, [job.id, terminal ? 'FAILED' : 'PENDING', reason]);
    if (terminal && job.kind === 'PAYOUT') {
      try { await applyPayoutProviderEvent({payoutId:String(job.payout_id),status:'FAILED',failureCode:'PROVIDER_EXECUTION_EXHAUSTED',idempotencyKey:`payout-failed:${job.id}:${job.attempts}`}); }
      catch (settlementError) { results.push({ok:false,jobId:job.id,kind:job.kind,error:reason,terminal,settlementError:settlementError instanceof Error?settlementError.message:String(settlementError)}); continue; }
    }
    results.push({ok:false,jobId:job.id,kind:job.kind,error:reason,terminal});
  }
}
console.log(JSON.stringify({ok:true,claimed:jobs.length,failed:results.filter(x=>!x.ok).length,results},null,2));
