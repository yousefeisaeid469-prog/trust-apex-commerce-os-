import { createHash } from 'node:crypto';
import { query, withPgTransaction } from './db/postgres';

const clean = (v: unknown, max = 240) => String(v ?? '').trim().slice(0, max);
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

export async function createSellerStore(userId: string, input: { storeName: string; description?: string; countryCode?: string; currency?: string; language?: string }) {
  const name = clean(input.storeName, 80); if (name.length < 2) throw new Error('INVALID_STORE_NAME');
  return withPgTransaction(async client => {
    const user = (await client.query(`select id,role from trust_users where id=$1 for update`, [userId])).rows[0];
    if (!user) throw new Error('USER_NOT_FOUND');
    const existing = (await client.query(`select id,user_id,store_name,slug,verification_status,created_at from trust_merchant_profiles where user_id=$1`, [userId])).rows[0];
    let merchant = existing;
    if (!merchant) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `store-${Date.now()}`;
      merchant = (await client.query(`insert into trust_merchant_profiles(user_id,store_name,slug) values($1,$2,$3) returning id,user_id,store_name,slug,verification_status,created_at`, [userId, name, slug])).rows[0];
      await client.query(`update trust_users set role='merchant',merchant_id=$1,updated_at=now() where id=$2`, [merchant.id, userId]);
    }
    await client.query(`insert into trust_merchant_store_settings(merchant_id,description,country_code,default_currency,default_language) values($1,$2,$3,$4,$5)
      on conflict(merchant_id) do update set description=excluded.description,country_code=excluded.country_code,default_currency=excluded.default_currency,default_language=excluded.default_language,updated_at=now()`,
      [merchant.id, clean(input.description, 1000), clean(input.countryCode || 'EG', 2).toUpperCase(), clean(input.currency || 'EGP', 3).toUpperCase(), clean(input.language || 'en', 12)]);
    return { id: String(merchant.id), storeName: String(merchant.store_name), slug: String(merchant.slug), verificationStatus: String(merchant.verification_status) };
  });
}

export async function createVariant(merchantId: string, productId: string, input: { sku: string; title: string; attributes?: Record<string, unknown>; price?: number; stock?: number }) {
  const sku = clean(input.sku, 80); const title = clean(input.title, 140);
  if (!sku || !title) throw new Error('INVALID_VARIANT');
  if (input.price !== undefined && (!Number.isFinite(input.price) || input.price <= 0)) throw new Error('INVALID_VARIANT_PRICE');
  if (input.stock !== undefined && (!Number.isInteger(input.stock) || input.stock < 0)) throw new Error('INVALID_VARIANT_STOCK');
  const ownership = await query(`select 1 from trust_products where id=$1 and merchant_id=$2`, [productId, merchantId]);
  if (!ownership.rows[0]) throw new Error('PRODUCT_OWNERSHIP_REQUIRED');
  const result = await query(`insert into trust_product_variants(product_id,sku,title,attributes_json,price,stock) values($1,$2,$3,$4,$5,$6) returning *`, [productId, sku, title, JSON.stringify(input.attributes ?? {}), input.price ?? null, input.stock ?? 0]);
  return result.rows[0];
}

export async function recordAiDecision(input: { decisionKey: string; model: string; decisionType: string; inputs: unknown; output: unknown; explanation: string; policyVersion: string; bounded?: boolean }) {
  const row = await query(`insert into trust_ai_decisions(decision_key,model,decision_type,input_hash,output_json,explanation,bounded,policy_version) values($1,$2,$3,$4,$5::jsonb,$6,$7,$8)
    on conflict(decision_key) do update set output_json=excluded.output_json,explanation=excluded.explanation,policy_version=excluded.policy_version returning *`,
    [clean(input.decisionKey,160), clean(input.model,100), clean(input.decisionType,100), hash(input.inputs), JSON.stringify(input.output), clean(input.explanation,1000), input.bounded !== false, clean(input.policyVersion,60)]);
  return row.rows[0];
}

export async function recordSecurityEvent(input: { actorId?: string; eventType: string; severity?: 'INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; requestId?: string; resourceType?: string; resourceId?: string; payload?: unknown }) {
  const row = await query(`insert into trust_security_events(actor_id,event_type,severity,request_id,resource_type,resource_id,payload_hash) values($1,$2,$3,$4,$5,$6,$7) returning id,created_at`,
    [input.actorId ?? null, clean(input.eventType,120), input.severity ?? 'INFO', clean(input.requestId,160) || null, clean(input.resourceType,80) || null, clean(input.resourceId,160) || null, hash(input.payload ?? {})]);
  return row.rows[0];
}

export async function queueNotification(userId: string, input: { channel?: 'IN_APP'|'EMAIL'|'SMS'|'WEBHOOK'; eventType: string; subject: string; body: string; idempotencyKey: string }) {
  const row = await query(`insert into trust_notifications(user_id,channel,event_type,subject,body,idempotency_key) values($1,$2,$3,$4,$5,$6)
    on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning *`, [userId, input.channel ?? 'IN_APP', clean(input.eventType,120), clean(input.subject,200), clean(input.body,2000), clean(input.idempotencyKey,200)]);
  return row.rows[0];
}

export async function getProductHealth() {
  const [users, merchants, products, orders, payments, notifications] = await Promise.all([
    query(`select count(*)::int count from trust_users where status='active'`),
    query(`select count(*)::int count from trust_merchant_profiles`),
    query(`select count(*)::int count from trust_products where active=true`),
    query(`select count(*)::int count from trust_orders`),
    query(`select count(*)::int count from trust_payments`),
    query(`select count(*)::int count from trust_notifications where status='QUEUED'`),
  ]);
  return { users: users.rows[0].count, merchants: merchants.rows[0].count, activeProducts: products.rows[0].count, orders: orders.rows[0].count, payments: payments.rows[0].count, queuedNotifications: notifications.rows[0].count, surfaces: ['AUTH','STORES','CATALOG','CART','CHECKOUT','ORDERS','PAYMENTS','RETURNS','DISPUTES','PAYOUTS','FULFILLMENT','NOTIFICATIONS'] };
}
