import { query, withPgTransaction } from '../platform/db/postgres';

const MEMBERSHIP_PLANS = {
  TRUST_PLUS: { monthlyFee: 149, benefits: ['FAST_DELIVERY_ELIGIBILITY','MEMBER_PRICING','PRIORITY_SUPPORT'] },
  TRUST_PRO: { monthlyFee: 299, benefits: ['FAST_DELIVERY_ELIGIBILITY','MEMBER_PRICING','PRIORITY_SUPPORT','EXCLUSIVE_BUNDLES'] },
} as const;

const money = (v: unknown) => Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0);
const int = (v: unknown) => Math.max(0, Math.floor(Number.isFinite(Number(v)) ? Number(v) : 0));
const text = (v: unknown, max = 160) => String(v ?? '').trim().slice(0, max);

export type MembershipPlan = keyof typeof MEMBERSHIP_PLANS;

export function quoteMembership(planCode: string) {
  const plan = MEMBERSHIP_PLANS[planCode as MembershipPlan];
  if (!plan) throw new Error('MEMBERSHIP_PLAN_NOT_FOUND');
  return { planCode, monthlyFee: plan.monthlyFee, benefits: [...plan.benefits] };
}

export function quoteQuantityPrice(input: { baseUnitPrice: number; quantity: number; tiers: Array<{ minQuantity: number; unitPrice: number }> }) {
  const quantity = money(input.quantity);
  if (quantity <= 0) throw new Error('QUANTITY_REQUIRED');
  const applicable = input.tiers.filter(t => money(t.minQuantity) <= quantity).sort((a,b) => money(b.minQuantity) - money(a.minQuantity))[0];
  const unitPrice = applicable ? money(applicable.unitPrice) : money(input.baseUnitPrice);
  return { quantity, unitPrice, subtotal: Number((quantity * unitPrice).toFixed(2)), tierMinQuantity: applicable ? money(applicable.minQuantity) : null };
}

export async function activateMembership(input: { customerId: string; planCode: string }) {
  const customerId = text(input.customerId, 80); const quote = quoteMembership(input.planCode);
  if (!customerId) throw new Error('CUSTOMER_REQUIRED');
  const r = await query(`insert into trust_marketplace_customer_memberships(customer_id,plan_code,status,monthly_fee,benefits_json,renews_at) values($1,$2,'ACTIVE',$3,$4::jsonb,now()+interval '30 days') on conflict(customer_id,plan_code) do update set status='ACTIVE',monthly_fee=excluded.monthly_fee,benefits_json=excluded.benefits_json,renews_at=excluded.renews_at,cancelled_at=null returning *`, [customerId, quote.planCode, quote.monthlyFee, JSON.stringify({ benefits: quote.benefits })]);
  return r.rows[0];
}

export async function createProductSubscription(input: { customerId: string; productId: string; quantity: number; intervalDays: number; discountBps?: number }) {
  const customerId = text(input.customerId, 80); const productId = text(input.productId, 80);
  const quantity = money(input.quantity); const intervalDays = int(input.intervalDays); const discountBps = Math.min(5000, int(input.discountBps ?? 0));
  if (!customerId || !productId || quantity <= 0 || intervalDays < 1) throw new Error('INVALID_SUBSCRIPTION');
  const r = await query(`insert into trust_marketplace_product_subscriptions(customer_id,product_id,quantity,interval_days,discount_bps,status,next_order_at) values($1,$2,$3,$4,$5,'ACTIVE',now()+make_interval(days=>$4)) on conflict(customer_id,product_id) do update set quantity=excluded.quantity,interval_days=excluded.interval_days,discount_bps=excluded.discount_bps,status='ACTIVE',next_order_at=excluded.next_order_at returning *`, [customerId, productId, quantity, intervalDays, discountBps]);
  return r.rows[0];
}

export async function createB2BAccount(input: { customerId: string; companyName: string; paymentTermsDays?: number; taxExempt?: boolean }) {
  const customerId = text(input.customerId, 80); const companyName = text(input.companyName, 180);
  const terms = int(input.paymentTermsDays ?? 0);
  if (!customerId || !companyName) throw new Error('B2B_ACCOUNT_REQUIRED');
  const r = await query(`insert into trust_marketplace_b2b_accounts(customer_id,company_name,payment_terms_days,tax_exempt) values($1,$2,$3,$4) on conflict(customer_id,company_name) do update set payment_terms_days=excluded.payment_terms_days,tax_exempt=excluded.tax_exempt returning *`, [customerId, companyName, terms, Boolean(input.taxExempt)]);
  return r.rows[0];
}

export async function upsertQuantityPrice(input: { productId: string; minQuantity: number; unitPrice: number }) {
  const productId = text(input.productId, 80); const minQuantity = money(input.minQuantity); const unitPrice = money(input.unitPrice);
  if (!productId || minQuantity <= 0) throw new Error('INVALID_QUANTITY_TIER');
  const r = await query(`insert into trust_marketplace_quantity_prices(product_id,min_quantity,unit_price) values($1,$2,$3) on conflict(product_id,min_quantity) do update set unit_price=excluded.unit_price returning *`, [productId, minQuantity, unitPrice]);
  return r.rows[0];
}

export async function recordAffiliateAttribution(input: { affiliateCode: string; attributedAmount: number; commissionBps: number; idempotencyKey: string; orderId?: string; merchantId?: string }) {
  const code = text(input.affiliateCode, 120); const key = text(input.idempotencyKey, 180);
  const amount = money(input.attributedAmount); const bps = Math.min(10000, int(input.commissionBps));
  if (!code || !key) throw new Error('AFFILIATE_ATTRIBUTION_REQUIRED');
  const commission = Number((amount * bps / 10000).toFixed(2));
  const r = await query(`insert into trust_marketplace_affiliate_ledger(affiliate_code,order_id,merchant_id,attributed_amount,commission_bps,commission_amount,status,idempotency_key) values($1,$2,$3,$4,$5,$6,'PENDING',$7) on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning *`, [code, input.orderId ?? null, input.merchantId ?? null, amount, bps, commission, key]);
  return r.rows[0];
}

export async function createFulfillmentProgram(input: { merchantId: string; programCode: 'PLATFORM_FULFILLMENT'|'MULTICHANNEL_FULFILLMENT'|'SELLER_FULFILLED'; warehouseCode?: string; storageRate?: number; pickPackRate?: number; shippingRate?: number; returnRate?: number }) {
  const merchantId = text(input.merchantId, 80); if (!merchantId) throw new Error('MERCHANT_REQUIRED');
  const r = await query(`insert into trust_marketplace_fulfillment_programs(merchant_id,program_code,warehouse_code,storage_rate,pick_pack_rate,shipping_rate,return_rate) values($1,$2,$3,$4,$5,$6,$7) on conflict(merchant_id,program_code,warehouse_code) do update set storage_rate=excluded.storage_rate,pick_pack_rate=excluded.pick_pack_rate,shipping_rate=excluded.shipping_rate,return_rate=excluded.return_rate,status='ACTIVE' returning *`, [merchantId,input.programCode,text(input.warehouseCode ?? 'DEFAULT',80),money(input.storageRate),money(input.pickPackRate),money(input.shippingRate),money(input.returnRate)]);
  return r.rows[0];
}

export async function revenueSnapshot() {
  const r = await query(`select (select coalesce(sum(fee_amount),0) from trust_marketplace_fee_ledger) marketplace_fees,(select coalesce(sum(amount),0) from trust_marketplace_ad_ledger) ad_revenue,(select coalesce(sum(monthly_fee),0) from trust_marketplace_customer_memberships where status='ACTIVE') membership_mrr,(select coalesce(sum(commission_amount),0) from trust_marketplace_affiliate_ledger where status in ('PENDING','APPROVED','PAID')) affiliate_commission,(select count(*) from trust_marketplace_b2b_accounts where status='APPROVED') approved_b2b_accounts`);
  return r.rows[0];
}
