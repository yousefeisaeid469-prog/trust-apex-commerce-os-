import { createHash } from 'crypto';
import { validateGuest, type GuestInfo } from './guest-validation';
import type { PoolClient } from 'pg';
import { normalizeIdempotencyKey, requestFingerprint } from '../../platform/persistence/idempotency';
import type { MarketplaceCheckoutPlan } from '../../marketplace/checkout-planner';
import { quoteMarketplacePromotions, commitPromotionTx, claimDealQuantityTx, recordPromotionApplicationsTx } from '../../marketplace/promotions';
import { evaluateFraudSignalsTx } from '../fraud/rules';
import { reserveInventoryTx } from '../inventory/reservations';
import { ensureOrderRuntimeOperationTx, transitionRuntimeOperationTx } from '../../platform/runtime-spine';

export type PaymentMethod = 'cod' | 'card';
export type CheckoutInput={customerId?:string;guest?:GuestInfo;lines:Array<{productId:string;quantity:number;offerId?:string}>;shipping:number;idempotencyKey:string;paymentMethod?:PaymentMethod;discountCode?:string;pricingSnapshot?:{subtotal:number;discount:number;shipping:number;total:number;currency:'EGP'};fulfillmentPlan?:MarketplaceCheckoutPlan};
export type CommittedOrder={id:string;customerId:string|null;subtotal:number;shipping:number;total:number;currency:'EGP';status:'pending'|'confirmed';paymentMethod:PaymentMethod;idempotentReplay:boolean};

const PHONE_RE = /^01[0125]\d{8}$/;

function keyHash(scope:string,key:string){return createHash('sha256').update(`${scope}|${key}`).digest('hex').slice(0,64);}
function toOrder(row:any,replay:boolean):CommittedOrder{return {id:String(row.id),customerId:row.customer_id?String(row.customer_id):null,subtotal:Number(row.subtotal),shipping:Number(row.shipping),total:Number(row.total),currency:'EGP',status:row.status,paymentMethod:row.payment_method,idempotentReplay:replay};}


export async function commitCheckout(client:PoolClient,input:CheckoutInput):Promise<CommittedOrder>{
  if((!input.customerId&&!input.guest)||!input.lines.length)throw new Error('INVALID_CHECKOUT');
  const idempotencyKey=normalizeIdempotencyKey(input.idempotencyKey);
  if(input.lines.some(line=>!Number.isInteger(line.quantity)||line.quantity<1))throw new Error('INVALID_QUANTITY');
  if(input.shipping<0||!Number.isFinite(input.shipping))throw new Error('INVALID_SHIPPING');
  const paymentMethod:PaymentMethod=input.paymentMethod==='card'?'card':'cod';
  // Serialize retries/races for the same idempotency key before touching stock.
  // This prevents a second request from consuming a different failure path while
  // the first request is still committing.
  await client.query(`select pg_advisory_xact_lock(hashtext($1))`, [`checkout.commit:${idempotencyKey}`]);
  // Guest checkout (no account) is only allowed for COD — there's no
  // payment credential to store either way, so no account is needed.
  // Card payments still require a logged-in customer.
  let guest:GuestInfo|undefined;
  if(!input.customerId){
    if(paymentMethod!=='cod') throw new Error('GUEST_CHECKOUT_REQUIRES_COD');
    guest=validateGuest(input.guest);
  }
  const initialStatus=paymentMethod==='cod'?'confirmed':'pending';
  const discountCode=input.discountCode?.trim().toUpperCase() || null;
  const requestHash=requestFingerprint('checkout.commit',{customerId:input.customerId??null,guest:guest??null,lines:input.lines,shipping:input.shipping,paymentMethod,discountCode,pricingSnapshot:input.pricingSnapshot??null});
  const hash=keyHash('checkout.commit',idempotencyKey);
  const cached=await client.query<{result_json:CommittedOrder;request_hash:string|null}>(`select result_json,request_hash from trust_idempotency_keys where key_hash=$1 and scope='checkout.commit' and expires_at>now()`,[hash]);
  if(cached.rows[0]){if(cached.rows[0].request_hash&&cached.rows[0].request_hash!==requestHash)throw new Error('IDEMPOTENCY_KEY_REUSED');return {...cached.rows[0].result_json,idempotentReplay:true};}

  const normalized=new Map<string,{quantity:number;offerId?:string}>();for(const line of input.lines){const existing=normalized.get(line.productId);if(existing && existing.offerId!==line.offerId)throw new Error('MULTIPLE_OFFERS_FOR_PRODUCT');normalized.set(line.productId,{quantity:(existing?.quantity??0)+line.quantity,offerId:line.offerId});}
  const plan=input.fulfillmentPlan;
  if(plan){
    if(!plan.destinationRegion || !Array.isArray(plan.items) || !Array.isArray(plan.shipments)) throw new Error('INVALID_FULFILLMENT_PLAN');
    for(const [productId,line] of normalized){
      const planned=plan.items.find(x=>x.productId===productId && x.offerId===line.offerId && x.qty===line.quantity);
      if(!planned) throw new Error('FULFILLMENT_PLAN_MISMATCH');
      if(!Number.isFinite(planned.unitPrice) || planned.unitPrice < 0) throw new Error('INVALID_FULFILLMENT_PLAN');
    }
  }
  let subtotal=0;let discount=0;const priced:Array<{productId:string;quantity:number;unitPrice:number;baseUnitPrice:number;offerId?:string}>=[];
  for(const [productId,line] of normalized){
    const result=await client.query<{id:string;price:string;stock:number;active:boolean}>(`select id,price,stock,active from trust_products where id=$1 for update`,[productId]);
    const product=result.rows[0];if(!product||!product.active)throw new Error('PRODUCT_NOT_AVAILABLE');
    let unitPrice=Number(product.price); let offerId=line.offerId;
    if(offerId){
      const offer=(await client.query<{id:string;price:string;stock:number;status:string}>(`select id,price,stock,status from trust_marketplace_offers where id=$1 and product_id=$2 for update`,[offerId,productId])).rows[0];
      if(!offer||offer.status!=='ACTIVE')throw new Error('OFFER_NOT_AVAILABLE'); if(offer.stock<line.quantity)throw new Error('INSUFFICIENT_OFFER_STOCK');
      unitPrice=Number(offer.price);
    } else if(product.stock<line.quantity) throw new Error('INSUFFICIENT_STOCK');
    if(!Number.isFinite(unitPrice)||unitPrice<0)throw new Error('INVALID_PRODUCT_PRICE');subtotal+=unitPrice*line.quantity;priced.push({productId,quantity:line.quantity,unitPrice,baseUnitPrice:unitPrice,offerId});
  }
  // Promotions are server-authoritative. Deals/coupons/vouchers and bounded dynamic prices
  // are recomputed at commit; a quote snapshot still protects against drift.
  const promotion = await quoteMarketplacePromotions({
    lines: priced.map(x=>({productId:x.productId,quantity:x.quantity,offerId:x.offerId})),
    promotionCode: discountCode ?? undefined,
    customerId: input.customerId,
    shippingBase: plan?.shipping ?? input.shipping
  });
  discount = promotion.discount;
  const effective = new Map(promotion.effectiveLines.map(x=>[`${x.productId}:${x.offerId??''}`,x]));
  subtotal = 0;
  for (const line of priced) {
    const e=effective.get(`${line.productId}:${line.offerId??''}`);
    if(!e) throw new Error('PROMOTION_LINE_MISMATCH');
    line.baseUnitPrice=e.baseUnitPrice;
    line.unitPrice=e.unitPrice;
    subtotal += e.unitPrice*line.quantity;
  }
  subtotal=Number(subtotal.toFixed(2));
  const plannedShipping=plan ? ((subtotal-discount)>=1500 ? 0 : Number(plan.shipping)) : undefined;
  // Shipping is server-authoritative: the client cannot choose the committed shipping amount.
  // Shipping is server-authoritative: the client cannot choose the committed shipping amount.
  const shipping=plannedShipping !== undefined ? plannedShipping : (subtotal===0?0:(subtotal-discount)>=1500?0:60);
  if(!Number.isFinite(shipping)||shipping<0) throw new Error('INVALID_SHIPPING');
  const total=Math.max(0,subtotal-discount+shipping);
  if(input.pricingSnapshot){
    const snapshot=input.pricingSnapshot;
    const same=(a:number,b:number)=>Math.abs(a-b)<0.000001;
    if(snapshot.currency!=='EGP' || !same(snapshot.subtotal,subtotal) || !same(snapshot.discount,discount) || !same(snapshot.shipping,shipping) || !same(snapshot.total,total)) throw new Error('QUOTE_PRICE_CHANGED');
  }
  const orderResult=await client.query<{id:string;customer_id:string|null;subtotal:number|string;shipping:number|string;total:number|string;status:string;payment_method:string}>(
    `insert into trust_orders(customer_id,status,subtotal,discount,shipping,total,currency,idempotency_key,request_hash,payment_method,guest_name,guest_phone,guest_address)
     values($1,$2,$3,$4,$5,$6,'EGP',$7,$8,$9,$10,$11,$12) on conflict(idempotency_key) do nothing returning id,customer_id,subtotal,shipping,total,status,payment_method`,
    [input.customerId??null,initialStatus,subtotal,discount,shipping,total,idempotencyKey,requestHash,paymentMethod,guest?.name??null,guest?.phone??null,guest?.address??null]
  );
  if(!orderResult.rows[0]){
    const existing=await client.query<{id:string;customer_id:string|null;subtotal:number|string;shipping:number|string;total:number|string;status:string;request_hash:string|null;payment_method:string}>(`select id,customer_id,subtotal,shipping,total,status,request_hash,payment_method from trust_orders where idempotency_key=$1 for update`,[idempotencyKey]);
    if(!existing.rows[0])throw new Error('CHECKOUT_RETRY_REQUIRED');
    if(existing.rows[0].request_hash!==requestHash)throw new Error('IDEMPOTENCY_KEY_REUSED');
    return toOrder(existing.rows[0],true);
  }
  const orderId=orderResult.rows[0].id;
  const runtime=await ensureOrderRuntimeOperationTx(client,String(orderId),{correlationId:idempotencyKey,metadata:{source:'checkout.commit',paymentMethod}});
  await transitionRuntimeOperationTx(client,runtime.operationId,paymentMethod==='card'?'WAITING':'RUNNING',{eventType:paymentMethod==='card'?'order.payment.waiting':'order.checkout.accepted',payload:{orderId:String(orderId),paymentMethod}});
  const sellerOrderIds=await createSellerOrdersTx(client,{orderId,currency:'EGP',customerSubtotal:subtotal,customerDiscount:discount,lines:priced,shipments:(plan?.shipments??[]).map(s=>({merchantId:s.merchantId,shipping:Number(s.shipping??0)})),idempotencyPrefix:`checkout:${idempotencyKey}`});
  for(const line of priced){
    const planned=plan?.items.find(x=>x.productId===line.productId && x.offerId===line.offerId && x.qty===line.quantity);
    if(planned && Math.abs(Number(planned.unitPrice)-line.baseUnitPrice)>0.000001) throw new Error(line.offerId ? 'OFFER_PRICE_CHANGED' : 'PRODUCT_PRICE_CHANGED');
    const merchantRow=await client.query<{merchant_id:string|null}>(`select coalesce(o.merchant_id,p.merchant_id) merchant_id from trust_products p left join trust_marketplace_offers o on o.id=$2 where p.id=$1`,[line.productId,line.offerId??null]);
    const sellerOrderId=merchantRow.rows[0]?.merchant_id?sellerOrderIds.get(String(merchantRow.rows[0].merchant_id))??null:null;
    const orderItem=(await client.query<{id:string}>(`insert into trust_order_items(order_id,product_id,quantity,unit_price,offer_id,seller_order_id) values($1,$2,$3,$4,$5,$6) returning id`,[orderId,line.productId,line.quantity,line.unitPrice,line.offerId??null,sellerOrderId])).rows[0];
    if(!orderItem) throw new Error('ORDER_ITEM_CREATE_FAILED');
    await reserveInventoryTx(client,{
      orderId,
      productId:line.productId,
      quantity:line.quantity,
      offerId:line.offerId,
      locationId:planned?.source==='NETWORK'?planned.locationId:undefined,
      orderItemId:orderItem.id,
      status:paymentMethod==='cod'?'consumed':'reserved',
    });
    if(line.offerId){
      const offerMerchant=await client.query<{merchant_id:string}>(`select merchant_id from trust_marketplace_offers where id=$1`,[line.offerId]);
      if(offerMerchant.rows[0]) await recordSellerOrderAcceptedTx(client,String(offerMerchant.rows[0].merchant_id),orderId,line.offerId);
    }
  }
  if(plan){
    for(const shipment of plan.shipments){
      await client.query(`insert into trust_order_shipments(order_id,merchant_id,location_id,destination_region,min_days,max_days,shipping_cost,fulfillment_cost,source,offer_ids) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,[orderId,shipment.merchantId,shipment.locationId??null,shipment.destinationRegion,shipment.minDays,shipment.maxDays,shipment.shippingCost,shipment.fulfillmentCost,shipment.source,JSON.stringify(shipment.offerIds)]);
    }
  }
  await claimDealQuantityTx(client, priced.map(x=>({offerId:x.offerId,quantity:x.quantity})));
  await recordPromotionApplicationsTx(client,{orderId,adjustments:promotion.adjustments});
  if(discountCode){ const ledgerAmount=Number(promotion.adjustments.filter(a=>a.kind==='COUPON'||a.kind==='VOUCHER').reduce((sum,a)=>sum+a.amount,0).toFixed(2)); if(ledgerAmount>0) await commitPromotionTx(client,{code:discountCode,customerId:input.customerId,orderId,discount:ledgerAmount,idempotencyKey:`${idempotencyKey}:promotion`,lines:priced.map(x=>({productId:x.productId,quantity:x.quantity,offerId:x.offerId}))}); }
  const order:CommittedOrder={id:orderId,customerId:input.customerId??null,subtotal,shipping,total,currency:'EGP',status:initialStatus,paymentMethod,idempotentReplay:false};
  await evaluateFraudSignalsTx(client,orderId,{customerId:input.customerId,guest,paymentMethod,total,lineCount:priced.length,shipping});
  await client.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,$3,'checkout','Initial order status')`,[orderId,null,initialStatus]);
  if(input.customerId){
    const {queueOrderStatusNotificationsTx}=await import('../../platform/notifications-3');
    await queueOrderStatusNotificationsTx(client,{orderId,customerId:input.customerId,status:initialStatus});
  }
  await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('order.created',$1,$2::jsonb)`,[orderId,JSON.stringify(order)]);
  await client.query(`insert into trust_idempotency_keys(key_hash,scope,result_json,request_hash,expires_at) values($1,'checkout.commit',$2::jsonb,$3,now()+interval '24 hours') on conflict(key_hash,scope) do update set result_json=excluded.result_json,request_hash=excluded.request_hash`,[hash,JSON.stringify(order),requestHash]);
  return order;
}
