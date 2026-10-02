import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres';

const clean=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
const money=(v:unknown)=>{const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error('INVALID_AMOUNT');return Number(n.toFixed(2));};
const currency=(v:unknown)=>{const c=clean(v||'EGP',3).toUpperCase();if(!/^[A-Z]{3}$/.test(c))throw new Error('INVALID_CURRENCY');return c;};

export async function createAdCampaign(input:{merchantId:string;name:string;type:'SPONSORED_PRODUCT'|'SPONSORED_BRAND'|'DISPLAY';dailyBudget:number;bid:number;currency?:string}){
  const name=clean(input.name,120);if(!name)throw new Error('CAMPAIGN_NAME_REQUIRED');
  const r=await query(`insert into trust_ad_campaigns(merchant_id,name,campaign_type,daily_budget,bid,currency) values($1,$2,$3,$4,$5,$6) returning *`,[input.merchantId,name,input.type,money(input.dailyBudget),money(input.bid),currency(input.currency)]);
  return r.rows[0];
}

export async function setAdCampaignStatus(input:{campaignId:string;merchantId:string;status:'ACTIVE'|'PAUSED'|'ENDED'}){
  const r=await query(`update trust_ad_campaigns set status=$3,updated_at=now() where id=$1 and merchant_id=$2 returning *`,[input.campaignId,input.merchantId,input.status]);
  if(!r.rows[0]) throw new Error('CAMPAIGN_NOT_FOUND');
  return r.rows[0];
}

export async function recordAdEvent(input:{campaignId:string;eventType:'IMPRESSION'|'CLICK'|'CONVERSION';amount?:number;currency?:string;orderId?:string;idempotencyKey:string;metadata?:unknown}){
  return withPgTransaction(async client=>{
    const existing=await client.query(`select * from trust_ad_events where idempotency_key=$1`,[input.idempotencyKey]);
    if(existing.rows[0]) return {...existing.rows[0],replay:true};
    const c=(await client.query(`select * from trust_ad_campaigns where id=$1 for update`,[input.campaignId])).rows[0];
    if(!c)throw new Error('CAMPAIGN_NOT_FOUND');
    if(c.status!=='ACTIVE')throw new Error('CAMPAIGN_NOT_ACTIVE');
    const amount=money(input.amount??(input.eventType==='CLICK'?Number(c.bid):0));
    if(input.eventType==='CLICK' && amount>0){
      const spent=(await client.query(`select coalesce(sum(amount),0) as total from trust_ad_events where campaign_id=$1 and event_type='CLICK' and occurred_at >= date_trunc('day',now())`,[input.campaignId])).rows[0];
      if(Number(spent.total)+amount>Number(c.daily_budget)) throw new Error('DAILY_AD_BUDGET_EXCEEDED');
    }
    const r=await client.query(`insert into trust_ad_events(campaign_id,event_type,amount,currency,order_id,idempotency_key,metadata_json) values($1,$2,$3,$4,$5,$6,$7::jsonb) returning *`,[input.campaignId,input.eventType,amount,currency(input.currency||c.currency),input.orderId??null,input.idempotencyKey,JSON.stringify(input.metadata??{})]);
    if(amount>0) await client.query(`insert into trust_revenue_ledger(merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,'ADS','CHARGE',$2,$3,'AD_EVENT',$4,$5,$6::jsonb)`,[c.merchant_id,amount,currency(input.currency||c.currency),r.rows[0].id,`ad-revenue:${input.idempotencyKey}`,JSON.stringify({campaignId:c.id,eventType:input.eventType})]);
    return {...r.rows[0],replay:false};
  });
}

export async function recordCommission(input:{merchantId:string;orderId:string;gross:number;rateBps:number;currency:string;idempotencyKey:string}){
  const gross=money(input.gross);if(input.rateBps<0||input.rateBps>10000)throw new Error('INVALID_COMMISSION_RATE');
  const fee=Number((gross*input.rateBps/10000).toFixed(2));
  return withPgTransaction(async client=>{
    const existing=await client.query(`select * from trust_revenue_ledger where idempotency_key=$1`,[input.idempotencyKey]);
    if(existing.rows[0])return {...existing.rows[0],replay:true};
    const r=await client.query(`insert into trust_revenue_ledger(order_id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,'COMMISSION','CHARGE',$3,$4,'ORDER',$1,$5,$6::jsonb) returning *`,[input.orderId,input.merchantId,fee,currency(input.currency),input.idempotencyKey,JSON.stringify({gross,rateBps:input.rateBps})]);
    await client.query(`insert into trust_merchant_finance_transactions(merchant_id,kind,amount,currency,status,reference_type,reference_id,idempotency_key) values($1,'FEE',$2,$3,'POSTED','ORDER',$4,$5)`,[input.merchantId,fee,currency(input.currency),input.orderId,`merchant-fee:${input.idempotencyKey}`]);
    return {...r.rows[0],replay:false};
  });
}

export async function createMerchantSubscription(input:{merchantId:string;planCode:string;provider?:string;providerSubscriptionId?:string;idempotencyKey:string}){
  return withPgTransaction(async client=>{
    const existing=await client.query(`select * from trust_merchant_subscriptions where idempotency_key=$1`,[input.idempotencyKey]);
    if(existing.rows[0])return {...existing.rows[0],replay:true};
    const plan=(await client.query(`select * from trust_subscription_plans where code=$1 and active=true`,[input.planCode])).rows[0];
    if(!plan)throw new Error('SUBSCRIPTION_PLAN_NOT_FOUND');
    await client.query(`update trust_merchant_subscriptions set status='CANCELLED',updated_at=now() where merchant_id=$1 and status in ('TRIALING','ACTIVE','PAST_DUE')`,[input.merchantId]);
    const start=new Date();const end=new Date(start);end.setUTCMonth(end.getUTCMonth()+1);
    const r=await client.query(`insert into trust_merchant_subscriptions(merchant_id,plan_code,status,provider,provider_subscription_id,current_period_start,current_period_end,idempotency_key) values($1,$2,'ACTIVE',$3,$4,$5,$6,$7) returning *`,[input.merchantId,input.planCode,input.provider||'internal',input.providerSubscriptionId||null,start,end,input.idempotencyKey]);
    if(Number(plan.monthly_price)>0) await client.query(`insert into trust_revenue_ledger(merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,'SUBSCRIPTION','CHARGE',$2,$3,'SUBSCRIPTION',$4,$5,$6::jsonb)`,[input.merchantId,plan.monthly_price,plan.currency,r.rows[0].id,`subscription-revenue:${input.idempotencyKey}`,JSON.stringify({planCode:plan.code})]);
    return {...r.rows[0],replay:false};
  });
}

export async function revenueSummary(merchantId?:string){
  const params=merchantId?[merchantId]:[];const where=merchantId?'where merchant_id=$1':'';
  const r=await query(`select surface,currency,sum(case when kind='CHARGE' then amount else -amount end) as net_amount,count(*)::int as entries from trust_revenue_ledger ${where} group by surface,currency order by surface,currency`,params);
  return r.rows;
}
