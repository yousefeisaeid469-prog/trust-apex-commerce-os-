import { query, withPgTransaction } from '../platform/db/postgres';
import type { PoolClient } from 'pg';
import { calculateDiscount, shouldApplyCoupon, evaluateDynamicPrice, type PromotionPolicy, type DynamicPricingContext } from './promotion-engine';

export type PromotionAdjustment={code:string;label:string;amount:number;kind:'DEAL'|'COUPON'|'VOUCHER';quantity?:number};
export type PromotionQuote={discount:number;adjustments:PromotionAdjustment[];effectiveLines:Array<{productId:string;offerId?:string;quantity:number;unitPrice:number;baseUnitPrice:number}>;promotionCode?:string};

const money=(v:unknown)=>Math.max(0,Number.isFinite(Number(v))?Number(v):0);
const int=(v:unknown)=>Math.floor(Number.isFinite(Number(v))?Number(v):0);
const clean=(v:unknown,max=120)=>String(v??'').trim().slice(0,max);

export function applyBoundedDynamicPrice(base:number,rule?:{enabled:boolean;minPrice:number;maxPrice:number;maxAdjustmentBps:number},stock?:number){
  return evaluateDynamicPrice(base,rule??{enabled:false,minPrice:base,maxPrice:base,maxAdjustmentBps:0},{stock}).price;
}

async function syncPromotionLifecycle(){
  await query(`update trust_marketplace_deals set status='ACTIVE',updated_at=now() where status='SCHEDULED' and starts_at<=now() and ends_at>now()`);
  await query(`update trust_marketplace_deals set status='EXPIRED',updated_at=now() where status in ('SCHEDULED','ACTIVE') and ends_at<=now()`);
  await query(`update trust_marketplace_coupons set status='ACTIVE',updated_at=now() where status='SCHEDULED' and starts_at<=now() and ends_at>now()`);
  await query(`update trust_marketplace_coupons set status='EXPIRED',updated_at=now() where status in ('SCHEDULED','ACTIVE') and ends_at<=now()`);
  await query(`update trust_marketplace_vouchers set status='EXPIRED',updated_at=now() where status='ACTIVE' and expires_at is not null and expires_at<=now()`);
}

export async function runPromotionLifecycle(){ await syncPromotionLifecycle(); return {ok:true}; }

export async function recordDynamicPriceDecision(input:{offerId:string;previousPrice:number;newPrice:number;reason:string;ruleId?:string;inputs?:DynamicPricingContext},client?:PoolClient){
  if(Math.abs(input.previousPrice-input.newPrice)<0.005) return {recorded:false};
  const run=async(c:PoolClient)=>{
    const existing=await c.query(`select 1 from trust_marketplace_price_history where offer_id=$1 and previous_price=$2 and new_price=$3 and reason=$4 and observed_at>now()-interval '5 minutes' limit 1`,[input.offerId,input.previousPrice,input.newPrice,input.reason]);
    if(existing.rows[0]) return {recorded:false};
    await c.query(`insert into trust_marketplace_price_history(offer_id,previous_price,new_price,reason,rule_id,inputs_json) values($1,$2,$3,$4,$5,$6::jsonb)`,[input.offerId,input.previousPrice,input.newPrice,input.reason,input.ruleId??null,JSON.stringify(input.inputs??{})]);
    return {recorded:true};
  };
  return client?run(client):withPgTransaction(run);
}

export async function quoteMarketplacePromotions(input:{lines:Array<{productId:string;quantity:number;offerId?:string}>;subtotalHint?:number;promotionCode?:string;customerId?:string;shippingBase?:number}):Promise<PromotionQuote>{
  await syncPromotionLifecycle();
  const lines=input.lines.map(l=>({...l,quantity:int(l.quantity)}));
  if(lines.some(l=>!l.productId||l.quantity<1))throw new Error('INVALID_PROMOTION_LINES');
  const effectiveLines=[] as PromotionQuote['effectiveLines'];
  const adjustments:PromotionAdjustment[]=[];
  let hasDeal=false;
  for(const line of lines){
    let base:number; let stock:number|undefined; let offerId=line.offerId; let dynamicMeta:any=null;
    if(offerId){
      const r=await query<any>(`select o.price,o.stock,o.status,r.enabled,r.min_price,r.max_price,r.max_adjustment_bps,r.min_dwell_minutes,r.seller_max_change_bps,r.approval_threshold_bps,r.updated_at,s.demand_velocity,s.conversion_rate,s.competitor_price,s.elasticity,s.observed_at from trust_marketplace_offers o left join trust_marketplace_dynamic_price_rules r on r.offer_id=o.id left join trust_marketplace_dynamic_price_signals s on s.offer_id=o.id where o.id=$1 and o.product_id=$2 limit 1`,[offerId,line.productId]);
      const row=r.rows[0]; if(!row||row.status!=='ACTIVE')throw new Error('OFFER_NOT_AVAILABLE');
      const rule=row.enabled===null?undefined:{enabled:Boolean(row.enabled),minPrice:Number(row.min_price),maxPrice:Number(row.max_price),maxAdjustmentBps:Number(row.max_adjustment_bps)};
      const signals:DynamicPricingContext={stock:Number(row.stock),demandVelocity:row.demand_velocity===null?undefined:Number(row.demand_velocity),conversionRate:row.conversion_rate===null?undefined:Number(row.conversion_rate),competitorPrice:row.competitor_price===null?undefined:Number(row.competitor_price),elasticity:row.elasticity===null?undefined:Number(row.elasticity),minDwellMinutes:row.min_dwell_minutes===null?0:Number(row.min_dwell_minutes),sellerMaxChangeBps:row.seller_max_change_bps===null?undefined:Number(row.seller_max_change_bps),approvalThresholdBps:row.approval_threshold_bps===null?undefined:Number(row.approval_threshold_bps)};
      const dynamic=rule?evaluateDynamicPrice(Number(row.price),rule,signals):{price:Number(row.price),adjustmentBps:0,reason:'DISABLED',eligible:false};
      base=dynamic.price; stock=Number(row.stock); dynamicMeta={previousPrice:Number(row.price),newPrice:dynamic.price,reason:dynamic.reason,ruleId:offerId};
      if(dynamic.price!==Number(row.price)) await recordDynamicPriceDecision({offerId:String(offerId),previousPrice:Number(row.price),newPrice:dynamic.price,reason:dynamic.reason,ruleId:String(offerId),inputs:signals});
    }else{
      const r=await query<any>(`select price,stock,active from trust_products where id=$1 limit 1`,[line.productId]);
      const row=r.rows[0]; if(!row||!row.active)throw new Error('PRODUCT_NOT_AVAILABLE'); base=Number(row.price);stock=Number(row.stock);
    }
    if(stock!==undefined&&stock<line.quantity)throw new Error(offerId?'INSUFFICIENT_OFFER_STOCK':'INSUFFICIENT_STOCK');
    if(offerId){
      const d=await query<any>(`select id,deal_type,discount_bps,discount_amount,badge,stacking_policy from trust_marketplace_deals where offer_id=$1 and status in ('SCHEDULED','ACTIVE') and starts_at<=now() and ends_at>now() and (quantity_limit is null or claimed_quantity+${line.quantity}<=quantity_limit) order by (case when deal_type='PERCENT' then discount_bps else null end) desc, id asc limit 1`,[offerId]);
      if(d.rows[0]){const amount=calculateDiscount(base,d.rows[0].deal_type,d.rows[0].discount_bps,d.rows[0].discount_amount);hasDeal=true;adjustments.push({code:String(d.rows[0].id),label:String(d.rows[0].badge||'DEAL'),amount:Number((amount*line.quantity).toFixed(2)),kind:'DEAL',quantity:line.quantity});}
    }
    if(dynamicMeta&&dynamicMeta.newPrice!==dynamicMeta.previousPrice) (dynamicMeta as any).__line={offerId,quantity:line.quantity};
    effectiveLines.push({productId:line.productId,offerId,quantity:line.quantity,unitPrice:base,baseUnitPrice:base});
  }
  const subtotal=Number(effectiveLines.reduce((s,l)=>s+l.baseUnitPrice*l.quantity,0).toFixed(2));
  const code=clean(input.promotionCode,80).toUpperCase();
  if(code){
    if(code.startsWith('VOUCHER-')){
      if(hasDeal) throw new Error('VOUCHER_EXCLUSIVE_CONFLICT');
      const v=await query<any>(`select id,remaining_amount,customer_id,status,starts_at,expires_at from trust_marketplace_vouchers where code=$1 limit 1`,[code]);
      const row=v.rows[0]; if(!row||row.status!=='ACTIVE'||Number(row.remaining_amount)<=0||new Date(row.starts_at)>new Date()||(row.expires_at&&new Date(row.expires_at)<=new Date())||(row.customer_id&&row.customer_id!==input.customerId))throw new Error('VOUCHER_NOT_AVAILABLE');
      const amount=Math.min(subtotal,money(row.remaining_amount)); if(amount>0)adjustments.push({code,label:'VOUCHER',amount:Number(amount.toFixed(2)),kind:'VOUCHER'});
    }else{
      const c=await query<any>(`select c.*,exists(select 1 from trust_orders o where o.customer_id=$1 and o.status<>'cancelled') as has_order from trust_marketplace_coupons c where c.code=$2 and c.status in ('SCHEDULED','ACTIVE') and c.starts_at<=now() and c.ends_at>now() limit 1`,[input.customerId??null,code]);
      const row=c.rows[0]; if(!row)throw new Error('COUPON_NOT_AVAILABLE');
      const policy:PromotionPolicy=row.stacking_policy||'STACK_DEAL'; if(!shouldApplyCoupon(policy,hasDeal,false))throw new Error('COUPON_EXCLUSIVE_CONFLICT');
      if(row.first_order_only&&row.has_order)throw new Error('COUPON_FIRST_ORDER_ONLY');
      const eligible=effectiveLines.filter(l=>{
        if(row.merchant_id && l.offerId) return true;
        if(row.merchant_id && !l.offerId) return true;
        if(row.offer_id && l.offerId!==String(row.offer_id)) return false;
        if(row.product_id && l.productId!==String(row.product_id)) return false;
        return true;
      });
      if(row.category_scope){
        const ids=effectiveLines.map(l=>l.productId); const cats=await query<any>(`select id,category from trust_products where id=any($1::uuid[])`,[ids]); const allowed=new Set(cats.rows.filter((x:any)=>String(x.category)===String(row.category_scope)).map((x:any)=>String(x.id))); eligible.splice(0,eligible.length,...effectiveLines.filter(l=>allowed.has(String(l.productId))));
      }
      if(row.merchant_id){
        const offerIds=eligible.map(l=>l.offerId).filter(Boolean); const productIds=eligible.map(l=>l.productId); const ownedOffers=offerIds.length?await query<any>(`select id from trust_marketplace_offers where id=any($1::uuid[]) and merchant_id=$2`,[offerIds,row.merchant_id]):{rows:[]}; const ownedProducts=productIds.length?await query<any>(`select id from trust_products where id=any($1::uuid[]) and merchant_id=$2`,[productIds,row.merchant_id]):{rows:[]}; const offerSet=new Set(ownedOffers.rows.map((x:any)=>String(x.id))); const productSet=new Set(ownedProducts.rows.map((x:any)=>String(x.id))); eligible.splice(0,eligible.length,...eligible.filter(l=>l.offerId?offerSet.has(String(l.offerId)):productSet.has(String(l.productId))));
      }
      if(input.customerId&&row.customer_segment){const seg=await query<any>(`select 1 from trust_marketplace_customer_segments where customer_id=$1 and segment=$2 limit 1`,[input.customerId,row.customer_segment]);if(!seg.rows[0])throw new Error('COUPON_SEGMENT_NOT_ELIGIBLE');}
      const eligibleSubtotal=Number(eligible.reduce((sum,l)=>sum+l.baseUnitPrice*l.quantity,0).toFixed(2));
      if(eligibleSubtotal<money(row.min_subtotal))throw new Error('COUPON_MINIMUM_NOT_MET');
      if(row.usage_limit!==null&&Number(row.used_count)>=Number(row.usage_limit))throw new Error('COUPON_USAGE_EXHAUSTED');
      if(input.customerId){const u=await query<any>(`select count(*)::int count from trust_marketplace_coupon_redemptions where coupon_id=$1 and customer_id=$2`,[row.id,input.customerId]);if(Number(u.rows[0]?.count||0)>=Number(row.per_customer_limit))throw new Error('COUPON_CUSTOMER_LIMIT');}
      let amount=row.discount_target==='SHIPPING'?calculateDiscount(Math.max(0,money(input.shippingBase)),row.discount_type,row.discount_bps,row.discount_amount):calculateDiscount(eligibleSubtotal,row.discount_type,row.discount_bps,row.discount_amount);
      if(row.max_discount!==null)amount=Math.min(amount,money(row.max_discount));
      amount=Number(amount.toFixed(2)); if(amount>0)adjustments.push({code,label:row.discount_target==='SHIPPING'?'SHIPPING COUPON':'COUPON',amount,kind:'COUPON'});
    }
  }
  const discount=Number(adjustments.filter(a=>a.kind!=='DEAL'||a.label!=='DYNAMIC PRICE').reduce((s,a)=>s+a.amount,0).toFixed(2));
  return {discount,adjustments:adjustments.filter(a=>a.amount>0),effectiveLines,promotionCode:code||undefined};
}

export async function setDynamicPricingSignals(input:{offerId:string;demandVelocity:number;conversionRate:number;competitorPrice?:number;elasticity?:number}){
  const demand=Math.max(0,n(input.demandVelocity)); const conversion=Math.min(1,Math.max(0,n(input.conversionRate))); const competitor=input.competitorPrice===undefined?null:Math.max(0,n(input.competitorPrice));
  if(!input.offerId) throw new Error('OFFER_REQUIRED');
  const r=await query(`insert into trust_marketplace_dynamic_price_signals(offer_id,demand_velocity,conversion_rate,competitor_price,elasticity) values($1,$2,$3,$4,$5) on conflict(offer_id) do update set demand_velocity=excluded.demand_velocity,conversion_rate=excluded.conversion_rate,competitor_price=excluded.competitor_price,elasticity=excluded.elasticity,observed_at=now() returning *`,[input.offerId,demand,conversion,competitor,input.elasticity===undefined?null:n(input.elasticity)]);
  return r.rows[0];
}

export async function createDeal(input:{offerId:string;dealType:'PERCENT'|'FIXED';discountBps?:number;discountAmount?:number;startsAt:string;endsAt:string;quantityLimit?:number;badge?:string}){
  const values=[clean(input.offerId,80),input.dealType,input.dealType==='PERCENT'?int(input.discountBps):null,input.dealType==='FIXED'?money(input.discountAmount):null,input.startsAt,input.endsAt,input.quantityLimit?int(input.quantityLimit):null,clean(input.badge||'DEAL',40)];
  if(input.dealType==='PERCENT'&&(!values[2]||values[2]<=0||values[2]>9000))throw new Error('INVALID_DEAL_DISCOUNT');
  if(input.dealType==='FIXED'&&(!values[3]||values[3]<=0))throw new Error('INVALID_DEAL_DISCOUNT');
  const r=await query(`insert into trust_marketplace_deals(offer_id,deal_type,discount_bps,discount_amount,starts_at,ends_at,quantity_limit,badge,status) values($1,$2,$3,$4,$5,$6,$7,$8,'SCHEDULED') returning *`,values);return r.rows[0];
}

export async function redeemVoucher(input:{code:string;customerId?:string;orderId?:string;amount:number;idempotencyKey:string},client?:PoolClient){
  const run=async(c:PoolClient)=>{const v=(await c.query<any>(`select * from trust_marketplace_vouchers where code=$1 for update`,[clean(input.code,100).toUpperCase()])).rows[0];if(!v||v.status!=='ACTIVE'||(v.customer_id&&v.customer_id!==input.customerId))throw new Error('VOUCHER_NOT_AVAILABLE');const amount=Math.min(money(input.amount),money(v.remaining_amount));if(amount<=0)throw new Error('VOUCHER_EMPTY');const ins=await c.query(`insert into trust_marketplace_voucher_redemptions(voucher_id,order_id,customer_id,amount,idempotency_key) values($1,$2,$3,$4,$5) on conflict(idempotency_key) do nothing returning id`,[v.id,input.orderId??null,input.customerId??null,amount,input.idempotencyKey]);if(!ins.rows[0])return {redeemed:0,replay:true};const remaining=Number((Number(v.remaining_amount)-amount).toFixed(2));await c.query(`update trust_marketplace_vouchers set remaining_amount=$2,status=case when $2=0 then 'EXHAUSTED' else status end,updated_at=now() where id=$1`,[v.id,remaining]);return {redeemed:amount,replay:false};};return client?run(client):withPgTransaction(run);
}

export async function createCoupon(input:{code:string;merchantId?:string;productId?:string;offerId?:string;discountType:'PERCENT'|'FIXED';discountBps?:number;discountAmount?:number;minSubtotal?:number;maxDiscount?:number;usageLimit?:number;perCustomerLimit?:number;startsAt:string;endsAt:string;categoryScope?:string;firstOrderOnly?:boolean;customerSegment?:string;stackingPolicy?:PromotionPolicy;discountTarget?:'ITEMS'|'SHIPPING'}){
  const code=clean(input.code,80).toUpperCase(); if(!/^[A-Z0-9_-]{4,80}$/.test(code))throw new Error('INVALID_COUPON_CODE');
  const bps=input.discountType==='PERCENT'?int(input.discountBps):null; const amount=input.discountType==='FIXED'?money(input.discountAmount):null;
  if(input.discountType==='PERCENT'&&(!bps||bps>9000))throw new Error('INVALID_COUPON_DISCOUNT');
  if(input.discountType==='FIXED'&&(!amount||amount<=0))throw new Error('INVALID_COUPON_DISCOUNT');
  const r=await query(`insert into trust_marketplace_coupons(code,merchant_id,product_id,offer_id,discount_type,discount_bps,discount_amount,min_subtotal,max_discount,usage_limit,per_customer_limit,starts_at,ends_at,stacking_policy,category_scope,first_order_only,customer_segment,discount_target,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'SCHEDULED') returning *`,[code,input.merchantId??null,input.productId??null,input.offerId??null,input.discountType,bps,amount,money(input.minSubtotal),input.maxDiscount?money(input.maxDiscount):null,input.usageLimit?int(input.usageLimit):null,Math.max(1,int(input.perCustomerLimit??1)),input.startsAt,input.endsAt,input.stackingPolicy??'STACK_DEAL',input.categoryScope??null,Boolean(input.firstOrderOnly),input.customerSegment??null,input.discountTarget??'ITEMS']);
  return r.rows[0];
}

export async function issueVoucher(input:{code:string;customerId?:string;amount:number;expiresAt?:string}){
  const code=clean(input.code,100).toUpperCase(); const amount=money(input.amount); if(!/^VOUCHER-[A-Z0-9_-]{4,80}$/.test(code)||amount<=0)throw new Error('INVALID_VOUCHER');
  const r=await query(`insert into trust_marketplace_vouchers(code,customer_id,original_amount,remaining_amount,expires_at,status) values($1,$2,$3,$3,$4,'ACTIVE') returning *`,[code,input.customerId??null,amount,input.expiresAt??null]);return r.rows[0];
}

export async function commitPromotionTx(client:PoolClient,input:{code?:string;customerId?:string;orderId:string;discount:number;idempotencyKey:string;lines:Array<{productId:string;quantity:number;offerId?:string}>}){
  const code=clean(input.code,100).toUpperCase(); if(!code)return {kind:null,amount:0,replay:false};
  if(code.startsWith('VOUCHER-')){
    const v=(await client.query<any>(`select * from trust_marketplace_vouchers where code=$1 for update`,[code])).rows[0];
    if(!v||v.status!=='ACTIVE'||(v.customer_id&&v.customer_id!==input.customerId))throw new Error('VOUCHER_NOT_AVAILABLE');
    const amount=Math.min(money(v.remaining_amount),money(input.discount)); if(amount<=0)throw new Error('VOUCHER_EMPTY');
    const ins=await client.query(`insert into trust_marketplace_voucher_redemptions(voucher_id,order_id,customer_id,amount,idempotency_key) values($1,$2,$3,$4,$5) on conflict(idempotency_key) do nothing returning id`,[v.id,input.orderId,input.customerId??null,amount,input.idempotencyKey]);
    if(!ins.rows[0])return {kind:'VOUCHER',amount:0,replay:true};
    const remaining=Number((Number(v.remaining_amount)-amount).toFixed(2)); await client.query(`update trust_marketplace_vouchers set remaining_amount=$2,status=case when $2=0 then 'EXHAUSTED' else status end,updated_at=now() where id=$1`,[v.id,remaining]);
    return {kind:'VOUCHER',amount,replay:false};
  }
  const c=(await client.query<any>(`select * from trust_marketplace_coupons where code=$1 for update`,[code])).rows[0];
  if(!c||c.status!=='ACTIVE')throw new Error('COUPON_NOT_AVAILABLE');
  if(c.usage_limit!==null&&Number(c.used_count)>=Number(c.usage_limit))throw new Error('COUPON_USAGE_EXHAUSTED');
  if(input.customerId){const u=(await client.query<any>(`select count(*)::int count from trust_marketplace_coupon_redemptions where coupon_id=$1 and customer_id=$2`,[c.id,input.customerId])).rows[0];if(Number(u.count)>=Number(c.per_customer_limit))throw new Error('COUPON_CUSTOMER_LIMIT');}
  const ins=await client.query(`insert into trust_marketplace_coupon_redemptions(coupon_id,customer_id,order_id,discount_amount,idempotency_key) values($1,$2,$3,$4,$5) on conflict(idempotency_key) do nothing returning id`,[c.id,input.customerId??null,input.orderId,input.discount,input.idempotencyKey]);
  if(!ins.rows[0])return {kind:'COUPON',amount:0,replay:true};
  await client.query(`update trust_marketplace_coupons set used_count=used_count+1,updated_at=now() where id=$1`,[c.id]); return {kind:'COUPON',amount:input.discount,replay:false};
}

export async function recordPromotionApplicationsTx(client:PoolClient,input:{orderId:string;adjustments:PromotionAdjustment[]}){
  for(const a of input.adjustments){
    await client.query(`insert into trust_marketplace_promotion_applications(order_id,kind,promotion_id,amount,quantity) values($1,$2,$3,$4,$5) on conflict(order_id,kind,promotion_id) do nothing`,[input.orderId,a.kind,a.code,a.amount,a.quantity??0]);
  }
}

export async function reversePromotionApplicationsTx(client:PoolClient,input:{orderId:string;idempotencyKey:string}){
  const rows=await client.query<any>(`select * from trust_marketplace_promotion_applications where order_id=$1 and reversed_at is null for update`,[input.orderId]);
  let reversed=0;
  for(const row of rows.rows){
    const reversalKey=`${input.idempotencyKey}:${row.id}`;
    if(row.kind==='DEAL'){
      await client.query(`update trust_marketplace_deals set claimed_quantity=greatest(0,claimed_quantity-$2),updated_at=now(),status=case when status='EXPIRED' and ends_at>now() then 'ACTIVE' else status end where id=$1`,[row.promotion_id,Number(row.quantity||0)]);
    } else if(row.kind==='COUPON') {
      await client.query(`update trust_marketplace_coupons set used_count=greatest(0,used_count-1),updated_at=now() where code=$1`,[row.promotion_id]);
      await client.query(`update trust_marketplace_coupon_redemptions set reversed_at=now(),reversal_idempotency_key=$2 where order_id=$1 and reversed_at is null`,[input.orderId,reversalKey]);
    } else if(row.kind==='VOUCHER') {
      await client.query(`update trust_marketplace_vouchers v set remaining_amount=least(original_amount,remaining_amount+$2),status=case when expires_at is not null and expires_at<=now() then 'EXPIRED' else 'ACTIVE' end,updated_at=now() where code=$1`,[row.promotion_id,Number(row.amount||0)]);
      await client.query(`update trust_marketplace_voucher_redemptions set reversed_at=now(),reversal_idempotency_key=$2 where order_id=$1 and reversed_at is null`,[input.orderId,reversalKey]);
    }
    await client.query(`update trust_marketplace_promotion_applications set reversed_at=now(),reversal_idempotency_key=$2 where id=$1 and reversed_at is null`,[row.id,reversalKey]); reversed++;
  }
  return {reversed};
}

export async function claimDealQuantityTx(client:PoolClient,lines:Array<{offerId?:string;quantity:number}>){
  for(const line of lines){if(!line.offerId)continue; const r=await client.query<any>(`select d.id,d.quantity_limit,d.claimed_quantity,d.starts_at,d.ends_at,d.status from trust_marketplace_deals d join trust_marketplace_offers o on o.id=d.offer_id where d.offer_id=$1 and d.status='ACTIVE' and d.starts_at<=now() and d.ends_at>now() and (d.quantity_limit is null or d.claimed_quantity+$2<=d.quantity_limit) order by (case when d.deal_type='PERCENT' then o.price*d.discount_bps/10000 else d.discount_amount end) desc,d.id asc limit 1 for update`,[line.offerId,line.quantity]);const d=r.rows[0];if(!d)continue;if(d.quantity_limit!==null&&Number(d.claimed_quantity)+line.quantity>Number(d.quantity_limit))throw new Error('DEAL_QUANTITY_EXHAUSTED');await client.query(`update trust_marketplace_deals set claimed_quantity=claimed_quantity+$2,updated_at=now() where id=$1`,[d.id,line.quantity]);}
}

export async function listActiveDeals(limit=48){
  await syncPromotionLifecycle();
  const safe=Math.min(100,Math.max(1,int(limit))); const r=await query<any>(`select d.id,d.offer_id,d.deal_type,d.discount_bps,d.discount_amount,d.badge,d.ends_at,d.quantity_limit,d.claimed_quantity,o.product_id,o.price,o.stock,o.shipping_fee,p.name,p.image from trust_marketplace_deals d join trust_marketplace_offers o on o.id=d.offer_id join trust_products p on p.id=o.product_id where d.status='ACTIVE' and d.starts_at<=now() and d.ends_at>now() and o.status='ACTIVE' and o.stock>0 order by d.ends_at asc,d.id asc limit $1`,[safe]);
  return r.rows.map((x:any)=>{const original=Number(x.price);const amount=calculateDiscount(original,x.deal_type,x.discount_bps,x.discount_amount);return {id:String(x.id),offerId:String(x.offer_id),productId:String(x.product_id),name:String(x.name),image:x.image??null,badge:String(x.badge),dealType:x.deal_type,discountBps:x.discount_bps===null?null:Number(x.discount_bps),discountAmount:x.discount_amount===null?null:Number(x.discount_amount),originalPrice:original,price:Number((original-amount).toFixed(2)),shippingFee:Number(x.shipping_fee),stock:Number(x.stock),remainingDealQuantity:x.quantity_limit===null?null:Math.max(0,Number(x.quantity_limit)-Number(x.claimed_quantity)),endsAt:new Date(x.ends_at).toISOString()};});
}
