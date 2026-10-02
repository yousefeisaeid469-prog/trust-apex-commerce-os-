import { createHash } from 'node:crypto';
import { query, withPgTransaction } from './db/postgres';

export const SELLER_PLANS = {
  STARTER: { monthlyFee: 0, perOrderFee: 5 },
  PROFESSIONAL: { monthlyFee: 999, perOrderFee: 0 },
} as const;

export const AD_TYPES = ['SPONSORED_PRODUCT','SPONSORED_BRAND','SPONSORED_DISPLAY'] as const;
export type AdType = typeof AD_TYPES[number];

const money = (n: unknown) => Math.max(0, Number.isFinite(Number(n)) ? Number(n) : 0);
const int = (n: unknown) => Math.max(0, Math.floor(Number.isFinite(Number(n)) ? Number(n) : 0));
const text = (v: unknown, max=180) => String(v ?? '').trim().slice(0,max);
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

export function quoteMarketplaceFee(input:{planCode:string;baseAmount:number;commissionBps:number;idempotencyKey:string}) {
  const base = money(input.baseAmount);
  const bps = int(input.commissionBps);
  const plan = SELLER_PLANS[input.planCode as keyof typeof SELLER_PLANS];
  if (!plan) throw new Error('SELLER_PLAN_NOT_FOUND');
  const commission = Number(((base * bps) / 10000).toFixed(2));
  return { programCode:'MARKETPLACE_COMMISSION', planCode:input.planCode, baseAmount:base, commissionBps:bps, commissionAmount:commission, perOrderFee:plan.perOrderFee, totalFee:Number((commission + plan.perOrderFee).toFixed(2)), idempotencyKey:text(input.idempotencyKey) };
}

export function quoteAdClick(input:{bidAmount:number;dailyBudget:number;spentToday:number}) {
  const bid = money(input.bidAmount); const budget=money(input.dailyBudget); const spent=money(input.spentToday);
  if (bid<=0) throw new Error('AD_BID_REQUIRED');
  if (spent + bid > budget) return {accepted:false,reason:'DAILY_BUDGET_EXCEEDED',charge:0};
  return {accepted:true,reason:'OK',charge:bid};
}

export function quoteSubscriptionPrice(input:{price:number;discountBps:number}) {
  const price=money(input.price); const bps=Math.min(5000,int(input.discountBps));
  return Number((price * (10000-bps) / 10000).toFixed(2));
}

export function quoteFulfillmentFee(input:{storage:number;pickPack:number;shipping:number;returns:number}) {
  return Number((money(input.storage)+money(input.pickPack)+money(input.shipping)+money(input.returns)).toFixed(2));
}

export async function createSellerPlan(input:{merchantId:string;planCode:string}) {
  const merchantId=text(input.merchantId); const planCode=text(input.planCode,40);
  if (!merchantId || !(planCode in SELLER_PLANS)) throw new Error('INVALID_SELLER_PLAN');
  const p=SELLER_PLANS[planCode as keyof typeof SELLER_PLANS];
  const r=await query(`insert into trust_marketplace_seller_plans(merchant_id,plan_code,monthly_fee,per_order_fee) values($1,$2,$3,$4) on conflict(merchant_id) do update set plan_code=excluded.plan_code,monthly_fee=excluded.monthly_fee,per_order_fee=excluded.per_order_fee,status='ACTIVE',ended_at=null returning *`,[merchantId,planCode,p.monthlyFee,p.perOrderFee]);
  return r.rows[0];
}

export async function recordMarketplaceFee(input:{merchantId:string;orderId?:string;feeType:string;programCode:string;baseAmount:number;rateBps:number;idempotencyKey:string}) {
  const quote=quoteMarketplaceFee({planCode: input.programCode==='PROFESSIONAL'?'PROFESSIONAL':'STARTER',baseAmount:input.baseAmount,commissionBps:input.rateBps,idempotencyKey:input.idempotencyKey});
  const r=await query(`insert into trust_marketplace_fee_ledger(merchant_id,order_id,fee_type,program_code,base_amount,rate_bps,fee_amount,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(merchant_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning *`,[text(input.merchantId),input.orderId??null,text(input.feeType,60),text(input.programCode,60),quote.baseAmount,quote.commissionBps,quote.totalFee,text(input.idempotencyKey)]);
  return r.rows[0];
}

export async function createAdCampaign(input:{merchantId:string;type:AdType;name:string;dailyBudget:number;bidAmount:number;targeting?:Record<string,unknown>}) {
  if (!AD_TYPES.includes(input.type)) throw new Error('INVALID_AD_TYPE');
  const r=await query(`insert into trust_marketplace_ad_campaigns(merchant_id,campaign_type,name,daily_budget,bid_amount,status,targeting_json) values($1,$2,$3,$4,$5,'DRAFT',$6::jsonb) returning *`,[text(input.merchantId),input.type,text(input.name,140),money(input.dailyBudget),money(input.bidAmount),JSON.stringify(input.targeting??{})]);
  return r.rows[0];
}

export async function recordAdClick(input:{campaignId:string;bidAmount:number;idempotencyKey:string;orderId?:string}) {
  return withPgTransaction(async client=>{
    const campaign=await client.query(`select * from trust_marketplace_ad_campaigns where id=$1 for update`,[text(input.campaignId)]);
    if(!campaign.rows[0]) throw new Error('AD_CAMPAIGN_NOT_FOUND');
    const spent=await client.query(`select coalesce(sum(amount),0) total from trust_marketplace_ad_ledger where campaign_id=$1 and occurred_at>=date_trunc('day',now())`,[text(input.campaignId)]);
    const decision=quoteAdClick({bidAmount:input.bidAmount,dailyBudget:Number(campaign.rows[0].daily_budget),spentToday:Number(spent.rows[0].total)});
    if(!decision.accepted) throw new Error(decision.reason);
    const r=await client.query(`insert into trust_marketplace_ad_ledger(campaign_id,event_type,amount,order_id,idempotency_key) values($1,'CLICK',$2,$3,$4) on conflict(campaign_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning *`,[text(input.campaignId),decision.charge,input.orderId??null,text(input.idempotencyKey)]);
    return r.rows[0];
  });
}

export async function getGrowthSnapshot(merchantId:string) {
  const id=text(merchantId);
  const [fees,ads,sellers]=await Promise.all([
    query(`select coalesce(sum(fee_amount),0) total from trust_marketplace_fee_ledger where merchant_id=$1`,[id]),
    query(`select count(*) campaigns,coalesce(sum(l.amount),0) ad_spend from trust_marketplace_ad_campaigns c left join trust_marketplace_ad_ledger l on l.campaign_id=c.id where c.merchant_id=$1`,[id]),
    query(`select plan_code,status,monthly_fee,per_order_fee from trust_marketplace_seller_plans where merchant_id=$1`,[id])
  ]);
  return {merchantId:id, marketplaceFees:Number(fees.rows[0].total), campaigns:Number(ads.rows[0].campaigns), adSpend:Number(ads.rows[0].ad_spend), sellerPlan:sellers.rows[0]??null, generatedAt:new Date().toISOString(), fingerprint:hash({merchantId:id,fees:fees.rows[0].total,campaigns:ads.rows[0].campaigns})};
}
