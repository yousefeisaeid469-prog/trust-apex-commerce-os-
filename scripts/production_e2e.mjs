import crypto from 'node:crypto';
import { query, withPgTransaction, closePostgresPool } from '../modules/platform/db/postgres.ts';
import { registerUser, createSession } from '../modules/platform/auth/store.ts';
import { createSellerStore } from '../modules/platform/product-core.ts';
import { createMerchantProduct } from '../modules/commerce/repository/catalog.ts';
import { addToCart, cartSummary } from '../modules/commerce/cart/store.ts';
import { createQuote, placeOrderFromQuote } from '../modules/commerce/core/engine.ts';
import { createPaymentIntent, applyPaymentEvent } from '../modules/commerce/payments/orchestrator.ts';
import { createShipment } from '../modules/platform/fulfillment-tracking-3/index.ts';
import { recordTrackingEvent } from '../modules/platform/fulfillment-tracking-3/core.ts';
import { requestPayoutTx, applyPayoutEventTx, reconcileSellerBalancesTx } from '../modules/marketplace/financial-loop.ts';
import { startProductionE2ERun, recordProductionE2EStep, finishProductionE2ERun } from '../modules/platform/production-e2e-evidence.ts';

const required = ['DATABASE_URL','E2E_APP_BASE_URL','E2E_PAYMENT_PROVIDER','E2E_PAYMENT_PROVIDER_BASE_URL','TRUST_PAYMENT_WEBHOOK_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) throw new Error(`PRODUCTION_E2E_PREREQUISITES_MISSING:${missing.join(',')}`);
if ((process.env.TRUST_ENVIRONMENT ?? 'SANDBOX') === 'LIVE' && process.env.E2E_ALLOW_LIVE !== 'true') throw new Error('LIVE_E2E_REQUIRES_EXPLICIT_OPT_IN');

const base = process.env.E2E_APP_BASE_URL.replace(/\/$/,'');
const provider = process.env.E2E_PAYMENT_PROVIDER;
const runKey = process.env.E2E_RUN_KEY || `e2e-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const environment = process.env.TRUST_ENVIRONMENT === 'LIVE' ? 'LIVE' : process.env.TRUST_ENVIRONMENT === 'STAGING' ? 'STAGING' : 'SANDBOX';
const evidence = await startProductionE2ERun({runKey,environment,appBaseUrl:base,provider});
const runId = String(evidence.id);
const results = [];

async function step(key, fn) {
  const started = new Date();
  await recordProductionE2EStep({runId,stepKey:key,status:'STARTED',startedAt:started});
  try {
    const value = await fn();
    const completed = new Date();
    await recordProductionE2EStep({runId,stepKey:key,status:'PASSED',startedAt:started,completedAt:completed,evidence:value});
    results.push({step:key,status:'PASSED',durationMs:completed.getTime()-started.getTime(),evidence:value});
    return value;
  } catch (error) {
    const completed = new Date();
    const message = error instanceof Error ? error.message : String(error);
    await recordProductionE2EStep({runId,stepKey:key,status:'FAILED',startedAt:started,completedAt:completed,errorCode:message.slice(0,120),errorMessage:message});
    results.push({step:key,status:'FAILED',durationMs:completed.getTime()-started.getTime(),error:message});
    throw error;
  }
}

function email(prefix){ return `${prefix}.${runKey}@e2e.trust.invalid`; }
async function register(prefix, password){
  const response = await fetch(`${base}/api/auth/register`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:email(prefix),password})});
  if (!response.ok) throw new Error(`AUTH_REGISTER_FAILED:${response.status}`);
  const data = await response.json();
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('SESSION_COOKIE_MISSING');
  return {user:data.user,cookie};
}
async function sellerRegister(){
  const response = await fetch(`${base}/api/auth/register/seller`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:email('seller'),password:'E2E-Only-Password-ChangeMe-123!',storeName:`TRUST E2E ${runKey}`,countryCode:'EG',currency:'EGP',language:'en'})});
  if (!response.ok) throw new Error(`SELLER_REGISTER_FAILED:${response.status}`);
  const data = await response.json();
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('SELLER_SESSION_COOKIE_MISSING');
  return {user:data.user,merchant:data.merchant,cookie};
}
async function api(path, options={}){
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text(); let data; try{data=JSON.parse(text)}catch{data={raw:text}};
  if(!response.ok) throw new Error(`API_${path}:${response.status}:${data?.error ?? 'UNKNOWN'}`);
  return data;
}

try {
  const seller = await step('SELLER_REGISTERED', sellerRegister);
  const sellerStore = await step('STORE_CREATED', async()=>seller.merchant);
  const product = await step('PRODUCT_CREATED', async()=>createMerchantProduct(String(seller.merchant.id), seller.merchant.storeName, {name:`E2E Product ${runKey}`,category:'E2E',price:250,stock:5,region:'GLOBAL',tags:['e2e']}));
  const buyer = await step('BUYER_REGISTERED', ()=>register('buyer','E2E-Only-Password-ChangeMe-123!'));
  await step('CART_UPDATED', ()=>addToCart(buyer.user.id,product.id,1));
  const summary = await step('CART_VALIDATED', ()=>cartSummary(buyer.user.id));
  const quote = await step('CHECKOUT_QUOTED', ()=>createQuote(summary.cart.items,10*60_000,undefined,'GLOBAL',buyer.user.id));
  const order = await step('CHECKOUT_COMMITTED', ()=>placeOrderFromQuote(buyer.user.id,quote.quoteId,`e2e-checkout:${runKey}`));
  const payment = await step('PAYMENT_INTENT_CREATED', ()=>withPgTransaction(tx=>createPaymentIntent({transaction:async work=>work(tx),query:(sql,params)=>tx.query(sql,params)},{orderId:order.id,customerId:buyer.user.id,provider,amount:order.total,currency:'EGP',idempotencyKey:`e2e-payment:${runKey}`})));
  const paymentRow = (await query(`select id,payment_intent_id from trust_payments where id=$1`,[payment.id])).rows[0];
  if(!paymentRow) throw new Error('PAYMENT_ROW_MISSING');

  const webhookPayload = {provider,eventId:`e2e-webhook:${runKey}`,eventType:'payment.captured',paymentIntentId:String(paymentRow.payment_intent_id),status:'captured',orderId:order.id};
  const raw = JSON.stringify(webhookPayload);
  const signature = crypto.createHmac('sha256',process.env.TRUST_PAYMENT_WEBHOOK_SECRET).update(raw).digest('hex');
  await step('PAYMENT_WEBHOOK', async()=>{
    const first = await api('/api/payments/webhook',{method:'POST',headers:{'content-type':'application/json','x-trust-signature':signature},body:raw});
    const replay = await api('/api/payments/webhook',{method:'POST',headers:{'content-type':'application/json','x-trust-signature':signature},body:raw});
    return {first,replay};
  });
  const shipment = await step('FULFILLMENT_SHIPMENT_CREATED', ()=>createShipment({orderId:order.id,carrier:'TRUST-E2E',service:'SANDBOX',destination:{country:'EG'}}));
  for(const status of ['LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY']) await step(`SHIPMENT_${status}`, ()=>recordTrackingEvent({shipmentId:String(shipment.id),status}));
  await step('DELIVERY_SIMULATED', ()=>recordTrackingEvent({shipmentId:String(shipment.id),status:'DELIVERED',description:'Deterministic E2E delivery simulation'}));
  const sellerFinance = await step('SELLER_BALANCE_CHECK', async()=> (await query(`select pending_balance,available_balance,held_balance,currency from trust_marketplace_seller_balances where merchant_id=$1`,[seller.merchant.id])).rows[0]);
  if(!sellerFinance || Number(sellerFinance.available_balance) <= 0) throw new Error('SELLER_BALANCE_NOT_RELEASED');
  const payout = await step('PAYOUT_REQUESTED', ()=>withPgTransaction(tx=>requestPayoutTx(tx,{merchantId:String(seller.merchant.id),amount:Number(sellerFinance.available_balance),currency:'EGP',provider:'TRUST-E2E-PAYOUT',idempotencyKey:`e2e-payout:${runKey}`})));
  await step('PAYOUT_PAID', ()=>withPgTransaction(tx=>applyPayoutEventTx(tx,{payoutId:String(payout.payoutId),status:'PAID',providerReference:`e2e-payout-ref:${runKey}`})));
  const reconciliation = await step('RECONCILIATION', ()=>withPgTransaction(tx=>reconcileSellerBalancesTx(tx,{merchantId:String(seller.merchant.id),idempotencyKey:`e2e-reconcile:${runKey}`})));
  if(Number(reconciliation.mismatch_count) !== 0) throw new Error(`RECONCILIATION_MISMATCH:${reconciliation.mismatch_count}`);
  const finalOrder = (await query(`select status,total,currency from trust_orders where id=$1`,[order.id])).rows[0];
  if(finalOrder?.status !== 'delivered') throw new Error(`ORDER_NOT_DELIVERED:${finalOrder?.status}`);
  await finishProductionE2ERun({runId,status:'PASSED',summary:{runKey,environment,provider,steps:results,orderId:order.id,productId:product.id,merchantId:seller.merchant.id,payoutId:payout.payoutId,reconciliationId:reconciliation.id}});
  console.log(JSON.stringify({ok:true,runId,runKey,environment,results},null,2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await finishProductionE2ERun({runId,status:'FAILED',summary:{runKey,environment,provider,error:message,steps:results}}).catch(()=>{});
  console.error(JSON.stringify({ok:false,runId,runKey,environment,error:message,results},null,2));
  process.exitCode=1;
} finally { await closePostgresPool(); }
