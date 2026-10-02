import type { PoolClient } from 'pg';
import { query, withPgTransaction } from '../db/postgres';

const clean=(v:unknown,max=180)=>String(v??'').trim().slice(0,max);
const money=(v:unknown)=>{const n=Number(v);if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_AMOUNT');return Number(n.toFixed(2));};
const currency=(v:unknown)=>{const c=clean(v||'EGP',3).toUpperCase();if(!/^[A-Z]{3}$/.test(c))throw new Error('INVALID_CURRENCY');return c;};

export const SELLER_SERVICES={
  GLOBAL_SELLING:{description:'Cross-border listing, localization and seller tooling',defaultPrice:99},
  BRAND_SERVICES:{description:'Brand protection and enhanced brand tooling',defaultPrice:199},
  PREMIUM_ANALYTICS:{description:'Advanced seller analytics and reporting',defaultPrice:79},
  LISTING_SERVICE:{description:'Catalog/listing optimization service',defaultPrice:49},
  SUPPLY_CHAIN_SERVICE:{description:'External supply-chain coordination service',defaultPrice:299},
} as const;

type ServiceCode=keyof typeof SELLER_SERVICES;

async function revenue(tx:PoolClient,input:{merchantId?:string;orderId?:string;surface:'SELLER_SERVICES'|'B2B'|'SUBSCRIPTION';amount:number;currency:string;referenceType:string;referenceId:string;idempotencyKey:string;metadata?:unknown}){
  await tx.query(`insert into trust_revenue_ledger(order_id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,$3,'CHARGE',$4,$5,$6,$7,$8,$9::jsonb) on conflict(idempotency_key) do nothing`,[input.orderId??null,input.merchantId??null,input.surface,input.amount,currency(input.currency),input.referenceType,input.referenceId,input.idempotencyKey,JSON.stringify(input.metadata??{})]);
}

export async function purchaseSellerService(input:{merchantId:string;serviceCode:ServiceCode;amount?:number;currency?:string;provider?:string;providerReference?:string;idempotencyKey:string}){
  const service=SELLER_SERVICES[input.serviceCode]; if(!service)throw new Error('SELLER_SERVICE_NOT_FOUND');
  const key=clean(input.idempotencyKey,220); if(!key)throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  const amount=money(input.amount??service.defaultPrice); const cur=currency(input.currency);
  return withPgTransaction(async tx=>{
    const old=await tx.query(`select * from trust_seller_service_orders where idempotency_key=$1 for update`,[key]);
    if(old.rows[0])return {...old.rows[0],replay:true};
    const merchant=await tx.query(`select id from trust_merchant_profiles where id=$1 for update`,[input.merchantId]);
    if(!merchant.rows[0])throw new Error('MERCHANT_NOT_FOUND');
    const row=await tx.query(`insert into trust_seller_service_orders(merchant_id,service_code,description,amount,currency,status,provider,provider_reference,idempotency_key) values($1,$2,$3,$4,$5,'PAID',$6,$7,$8) returning *`,[input.merchantId,input.serviceCode,service.description,amount,cur,input.provider??'internal',input.providerReference??null,key]);
    await revenue(tx,{merchantId:input.merchantId,surface:'SELLER_SERVICES',amount,currency:cur,referenceType:'SELLER_SERVICE_ORDER',referenceId:row.rows[0].id,idempotencyKey:`seller-service-revenue:${key}`,metadata:{serviceCode:input.serviceCode}});
    await tx.query(`insert into trust_merchant_finance_transactions(merchant_id,kind,amount,currency,status,reference_type,reference_id,idempotency_key) values($1,'FEE',$2,$3,'POSTED','SELLER_SERVICE',$4,$5) on conflict(idempotency_key) do nothing`,[input.merchantId,amount,cur,row.rows[0].id,`seller-service-fee:${key}`]);
    return {...row.rows[0],replay:false};
  });
}

export async function chargeB2BService(input:{b2bAccountId:string;serviceCode:string;amount:number;currency?:string;orderId?:string;idempotencyKey:string;metadata?:unknown}){
  const key=clean(input.idempotencyKey,220); if(!key)throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  const amount=money(input.amount); const cur=currency(input.currency);
  return withPgTransaction(async tx=>{
    const old=await tx.query(`select * from trust_b2b_service_charges where idempotency_key=$1 for update`,[key]);
    if(old.rows[0])return {...old.rows[0],replay:true};
    const account=(await tx.query(`select id,status from trust_marketplace_b2b_accounts where id=$1 for update`,[input.b2bAccountId])).rows[0];
    if(!account)throw new Error('B2B_ACCOUNT_NOT_FOUND');
    if(account.status!=='APPROVED')throw new Error('B2B_ACCOUNT_NOT_APPROVED');
    if(input.orderId){const order=(await tx.query(`select id from trust_orders where id=$1 for update`,[input.orderId])).rows[0];if(!order)throw new Error('ORDER_NOT_FOUND');}
    const row=await tx.query(`insert into trust_b2b_service_charges(b2b_account_id,service_code,order_id,amount,currency,status,idempotency_key,metadata_json) values($1,$2,$3,$4,$5,'CHARGED',$6,$7,$8::jsonb) returning *`,[input.b2bAccountId,clean(input.serviceCode,100),input.orderId??null,amount,cur,key,JSON.stringify(input.metadata??{})]);
    await revenue(tx,{surface:'B2B',orderId:input.orderId,amount,currency:cur,referenceType:'B2B_SERVICE_CHARGE',referenceId:row.rows[0].id,idempotencyKey:`b2b-revenue:${key}`,metadata:{serviceCode:input.serviceCode,b2bAccountId:input.b2bAccountId}});
    return {...row.rows[0],replay:false};
  });
}

export async function billMembershipRenewal(input:{membershipId:string;idempotencyKey:string;provider?:string;providerReference?:string}){
  const key=clean(input.idempotencyKey,220); if(!key)throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  return withPgTransaction(async tx=>{
    const old=await tx.query(`select * from trust_customer_membership_billing_events where idempotency_key=$1 for update`,[key]);
    if(old.rows[0])return {...old.rows[0],replay:true};
    const membership=(await tx.query(`select * from trust_marketplace_customer_memberships where id=$1 for update`,[input.membershipId])).rows[0];
    if(!membership)throw new Error('MEMBERSHIP_NOT_FOUND');
    if(membership.status!=='ACTIVE')throw new Error('MEMBERSHIP_NOT_ACTIVE');
    const amount=money(membership.monthly_fee); const cur='EGP';
    const event=await tx.query(`insert into trust_customer_membership_billing_events(membership_id,event_type,amount,currency,provider,provider_reference,idempotency_key) values($1,'RENEWAL',$2,$3,$4,$5,$6) returning *`,[input.membershipId,amount,cur,input.provider??'internal',input.providerReference??null,key]);
    if(amount>0)await revenue(tx,{surface:'SUBSCRIPTION',amount,currency:cur,referenceType:'MEMBERSHIP_BILLING',referenceId:event.rows[0].id,idempotencyKey:`membership-revenue:${key}`,metadata:{membershipId:input.membershipId,eventType:'RENEWAL'}});
    await tx.query(`update trust_marketplace_customer_memberships set renews_at=now()+interval '30 days',renewal_attempts=0 where id=$1`,[input.membershipId]);
    return {...event.rows[0],replay:false};
  });
}

export async function monetizationExpansionSummary(){
  const r=await query(`select surface,currency,sum(case when kind='CHARGE' then amount else -amount end) net_amount,count(*)::int entries from trust_revenue_ledger where surface in ('SELLER_SERVICES','B2B','SUBSCRIPTION') group by surface,currency order by surface,currency`);
  return r.rows;
}
