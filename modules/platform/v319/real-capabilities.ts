import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres';

const clean=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
const money=(v:unknown)=>{const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error('INVALID_AMOUNT');return Number(n.toFixed(2));};
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');

export async function listGiftCards(ownerId:string){
  const r=await query(`select id,code_prefix,initial_amount,remaining_amount,currency,status,recipient_email,expires_at,created_at from trust_gift_cards where owner_id=$1 order by created_at desc limit 100`,[ownerId]);
  return r.rows;
}

export async function issueGiftCard(input:{ownerId:string;amount:number;currency?:string;recipientEmail?:string;expiresAt?:string}){
  const amount=money(input.amount); if(amount<=0)throw new Error('INVALID_AMOUNT');
  const code=`TRUST-${randomBytes(12).toString('hex').toUpperCase()}`;
  const r=await query(`insert into trust_gift_cards(code_hash,code_prefix,owner_id,initial_amount,remaining_amount,currency,recipient_email,expires_at,status) values($1,$2,$3,$4,$4,$5,$6,$7,'ACTIVE') returning id,code_prefix,initial_amount,remaining_amount,currency,status,recipient_email,expires_at,created_at`,[hash(code),code.slice(0,12),input.ownerId,amount,clean(input.currency||'EGP',3).toUpperCase(),clean(input.recipientEmail,320)||null,input.expiresAt??null]);
  return {...r.rows[0],code};
}

export async function redeemGiftCard(input:{code:string;orderId?:string;amount:number;actorId:string;idempotencyKey:string}){
  return withPgTransaction(async client=>{
    const code=clean(input.code,100).toUpperCase(); const amount=money(input.amount); if(!code||amount<=0)throw new Error('INVALID_GIFT_CARD_REDEMPTION');
    const card=(await client.query(`select * from trust_gift_cards where code_hash=$1 for update`,[hash(code)])).rows[0];
    if(!card)throw new Error('GIFT_CARD_NOT_FOUND');
    if(card.status!=='ACTIVE'||Number(card.remaining_amount)<=0)throw new Error('GIFT_CARD_UNAVAILABLE');
    if(card.expires_at&&new Date(card.expires_at)<=new Date())throw new Error('GIFT_CARD_EXPIRED');
    const existing=await client.query(`select amount from trust_gift_card_transactions where idempotency_key=$1`,[input.idempotencyKey]);
    if(existing.rows[0])return {redeemed:Number(existing.rows[0].amount),replay:true};
    const redeemed=Math.min(amount,Number(card.remaining_amount));
    await client.query(`insert into trust_gift_card_transactions(card_id,order_id,actor_id,kind,amount,idempotency_key) values($1,$2,$3,'REDEEM',$4,$5)`,[card.id,input.orderId??null,input.actorId,redeemed,input.idempotencyKey]);
    const remaining=Number((Number(card.remaining_amount)-redeemed).toFixed(2));
    await client.query(`update trust_gift_cards set remaining_amount=$2,status=case when $2=0 then 'EXHAUSTED' else status end,updated_at=now() where id=$1`,[card.id,remaining]);
    return {redeemed,replay:false,remaining};
  });
}

export async function merchantFinanceSnapshot(merchantId:string){
  const [account,tx]=await Promise.all([
    query(`select merchant_id,currency,available_balance,pending_balance,lifetime_gross,lifetime_fees,updated_at from trust_merchant_finance_accounts where merchant_id=$1`,[merchantId]),
    query(`select id,kind,amount,currency,status,reference_type,reference_id,created_at from trust_merchant_finance_transactions where merchant_id=$1 order by created_at desc limit 100`,[merchantId])
  ]);
  return {account:account.rows[0]??null,transactions:tx.rows};
}

export async function requestMerchantPayout(input:{merchantId:string;amount:number;currency:string;idempotencyKey:string;reference?:string}){
  const amount=money(input.amount); if(amount<=0)throw new Error('INVALID_AMOUNT');
  return withPgTransaction(async client=>{
    const existing=await client.query(`select id,status,amount,currency from trust_merchant_finance_transactions where idempotency_key=$1`,[input.idempotencyKey]);
    if(existing.rows[0])return {...existing.rows[0],replay:true};
    const a=(await client.query(`select * from trust_merchant_finance_accounts where merchant_id=$1 for update`,[input.merchantId])).rows[0];
    if(!a)throw new Error('MERCHANT_FINANCE_ACCOUNT_NOT_FOUND');
    if(a.currency!==input.currency.toUpperCase())throw new Error('CURRENCY_MISMATCH');
    if(Number(a.available_balance)<amount)throw new Error('INSUFFICIENT_AVAILABLE_BALANCE');
    const id=randomUUID();
    await client.query(`update trust_merchant_finance_accounts set available_balance=available_balance-$2,updated_at=now() where merchant_id=$1`,[input.merchantId,amount]);
    const r=await client.query(`insert into trust_merchant_finance_transactions(id,merchant_id,kind,amount,currency,status,reference_type,reference_id,idempotency_key) values($1,$2,'PAYOUT', $3,$4,'REQUESTED','PAYOUT',$5,$6) returning id,status,amount,currency,reference_id`,[id,input.merchantId,amount,input.currency.toUpperCase(),clean(input.reference,160)||null,input.idempotencyKey]);
    return {...r.rows[0],replay:false};
  });
}

export async function evaluateAiQuality(input:{actorId:string;subjectId:string;inputText:string;expected?:string;actual?:string;model?:string}){
  const text=clean(input.inputText,20000); if(!text)throw new Error('INPUT_REQUIRED');
  const expected=clean(input.expected,20000); const actual=clean(input.actual,20000);
  const normalized=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
  const exact=Boolean(expected&&actual&&normalized(expected)===normalized(actual));
  const grounded=expected?Boolean(actual&&normalized(actual).includes(normalized(expected).slice(0,Math.min(80,normalized(expected).length)))):actual.length>0;
  const unsafe=/password|secret|api[_ -]?key|private key/i.test(actual);
  const score=Math.max(0,Math.min(100,Math.round((exact?70:grounded?50:30)+(actual.length>=20?20:0)+(unsafe?-60:10))));
  const status=unsafe?'FAIL':score>=70?'PASS':score>=40?'REVIEW':'FAIL';
  const r=await query(`insert into trust_ai_quality_evaluations(actor_id,subject_id,model,input_hash,expected_hash,actual_hash,score,status,checks_json) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) returning *`,[input.actorId,input.subjectId,clean(input.model||'deterministic-quality-v1',120),hash(text),expected?hash(expected):null,actual?hash(actual):null,score,status,JSON.stringify({exactMatch:exact,grounded,secretLeak:unsafe,inputLength:text.length,outputLength:actual.length})]);
  return r.rows[0];
}

export async function recordAgentAction(input:{tenantId:string;agentId:string;capability:string;decision:'ALLOWED'|'APPROVAL_REQUIRED'|'DENIED';reason:string;confidence:number;risk:string;payload:unknown}){
  const r=await query(`insert into trust_autonomy_actions(tenant_id,agent_id,capability,decision,reason,confidence,risk,payload_json) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb) returning *`,[input.tenantId,input.agentId,input.capability,input.decision,clean(input.reason,500),Math.max(0,Math.min(1,input.confidence)),input.risk,JSON.stringify(input.payload??{})]);
  return r.rows[0];
}

export async function recentAgentActions(tenantId:string){
  const r=await query(`select id,agent_id,capability,decision,reason,confidence,risk,payload_json,created_at from trust_autonomy_actions where tenant_id=$1 order by created_at desc limit 100`,[tenantId]);
  return r.rows;
}
