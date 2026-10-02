import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { normalizeIdempotencyKey, requestFingerprint } from '../../platform/persistence/idempotency';
import { minorToMajor, type GlobalCheckoutPricingLine } from '../../platform/global-commerce-v298';
import type { GlobalQuote } from '../../platform/global-commerce-v297/contracts.ts';
import { recordSellerOrderAcceptedTx } from '../../marketplace/seller-intelligence';
import { createSellerOrdersTx } from '../../marketplace/seller-orders';
import { reserveInventoryTx } from '../inventory/reservations';

export type GlobalCommitInput = {
  customerId:string;
  quoteId:string;
  idempotencyKey:string;
  paymentMethod:'card'|'cod';
};

export type GlobalCommittedOrder = {
  id:string; customerId:string|null; subtotal:number; shipping:number; total:number;
  currency:string; status:'pending'|'confirmed'; paymentMethod:'card'|'cod';
  idempotentReplay:boolean; destinationCountry:string; locale:string;
};

function keyHash(scope:string,key:string){
  return createHash('sha256').update(`${scope}|${key}`).digest('hex').slice(0,64);
}

export async function commitGlobalCheckout(client:PoolClient,input:GlobalCommitInput):Promise<GlobalCommittedOrder>{
  if(!input.customerId||!input.quoteId) throw new Error('INVALID_GLOBAL_CHECKOUT');
  const idempotencyKey=normalizeIdempotencyKey(input.idempotencyKey);
  const paymentMethod=input.paymentMethod;
  await client.query(`select pg_advisory_xact_lock(hashtext($1))`,[`checkout.global.commit:${idempotencyKey}`]);
  const requestHash=requestFingerprint('checkout.global.commit',{customerId:input.customerId,quoteId:input.quoteId,paymentMethod});
  const hash=keyHash('checkout.global.commit',idempotencyKey);
  const cached=await client.query<{result_json:GlobalCommittedOrder;request_hash:string|null}>(`select result_json,request_hash from trust_idempotency_keys where key_hash=$1 and scope='checkout.global.commit' and expires_at>now()`,[hash]);
  if(cached.rows[0]){if(cached.rows[0].request_hash!==requestHash)throw new Error('IDEMPOTENCY_KEY_REUSED');return {...cached.rows[0].result_json,idempotentReplay:true};}

  const q=(await client.query<any>(`select id,items_json,pricing_json,global_pricing_json,destination_country,locale,settlement_currency,shipping_mode,fx_quote_json,tax_snapshot_json,expires_at,consumed_at,pricing_version from trust_checkout_quotes where id=$1 for update`,[input.quoteId])).rows[0];
  if(!q||q.consumed_at||Date.parse(q.expires_at)<=Date.now()||q.pricing_version!=='V298.0.0') throw new Error('GLOBAL_QUOTE_EXPIRED_OR_NOT_FOUND');
  const quote=q.global_pricing_json as GlobalQuote;
  const items= q.items_json as GlobalCheckoutPricingLine[];
  if(!items.length) throw new Error('GLOBAL_QUOTE_EMPTY');
  const paymentMethods=Array.isArray(quote.paymentMethods)?quote.paymentMethods:[];
  const requestedCapability=paymentMethod==='card'?'CARD':'COD';
  if(!paymentMethods.includes(requestedCapability)) throw new Error('PAYMENT_METHOD_NOT_AVAILABLE');

  const subtotalMinor=quote.subtotal.amountMinor;
  const shippingMinor=quote.shipping.amountMinor;
  const taxMinor=quote.taxes.filter((t:any)=>!t.includedInPrice).reduce((n:any,t:any)=>n+BigInt(t.amountMinor),0n);
  const totalMinor=quote.total.amountMinor;
  const currency=q.settlement_currency;
  const subtotal=minorToMajor(BigInt(subtotalMinor),currency);
  const shipping=minorToMajor(BigInt(shippingMinor),currency);
  const total=minorToMajor(BigInt(totalMinor),currency);
  const status=paymentMethod==='cod'?'confirmed':'pending';

  const orderResult=await client.query<any>(`insert into trust_orders(customer_id,status,subtotal,discount,shipping,total,currency,idempotency_key,request_hash,payment_method,destination_country,locale,settlement_currency,shipping_mode,global_quote_id,fx_quote_json,tax_snapshot_json,global_pricing_json,pricing_version)
    values($1,$2,$3,0,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17::jsonb,'V298.0.0')
    on conflict(idempotency_key) do nothing returning id,customer_id,subtotal,shipping,total,status,payment_method`,[
    input.customerId,status,subtotal,shipping,total,currency,idempotencyKey,requestHash,paymentMethod,
    q.destination_country,q.locale,q.settlement_currency,q.shipping_mode,q.id,
    q.fx_quote_json?JSON.stringify(q.fx_quote_json):null,q.tax_snapshot_json?JSON.stringify(q.tax_snapshot_json):null,q.global_pricing_json?JSON.stringify(q.global_pricing_json):null
  ]);
  if(!orderResult.rows[0]){
    const prior=(await client.query<any>(`select id,customer_id,subtotal,shipping,total,status,payment_method,currency,destination_country,locale,request_hash from trust_orders where idempotency_key=$1 for update`,[idempotencyKey])).rows[0];
    if(!prior) throw new Error('CHECKOUT_RETRY_REQUIRED');
    if(prior.request_hash && prior.request_hash!==requestHash) throw new Error('IDEMPOTENCY_KEY_REUSED');
    return {...toOrder(prior),idempotentReplay:true};
  }
  const orderId=String(orderResult.rows[0].id);
  const globalLines=items.map((line:any)=>({productId:String(line.productId),offerId:line.offerId?String(line.offerId):undefined,quantity:Number(line.quantity),unitPrice:minorToMajor(BigInt(line.unitPriceMinor),currency)}));
  const globalPlan=(q.pricing_json as any)?.fulfillmentPlan;
  const sellerOrderIds=await createSellerOrdersTx(client,{orderId,currency,customerSubtotal:subtotal,customerDiscount:0,lines:globalLines,shipments:(globalPlan?.shipments??[]).map((s:any)=>({merchantId:String(s.merchantId),shipping:Number(s.shipping??0)})),idempotencyPrefix:`global:${idempotencyKey}`});

  const plan=(q.pricing_json as any)?.fulfillmentPlan;
  for(const line of items){
    const product=(await client.query<any>(`select id,price,active from trust_products where id=$1 for update`,[line.productId])).rows[0];
    if(!product||!product.active) throw new Error('PRODUCT_NOT_AVAILABLE');
    const sourceMajor=Number(line.sourceUnitPriceMinor)/100;
    if(line.offerId){
      const offer=(await client.query<any>(`select id,price,status,merchant_id from trust_marketplace_offers where id=$1 and product_id=$2 for update`,[line.offerId,line.productId])).rows[0];
      if(!offer||offer.status!=='ACTIVE') throw new Error('OFFER_NOT_AVAILABLE');
      if(Math.abs(Number(offer.price)-sourceMajor)>0.000001) throw new Error('GLOBAL_QUOTE_PRICE_CHANGED');
    } else if(Number(product.price)!==sourceMajor) throw new Error('GLOBAL_QUOTE_PRICE_CHANGED');
    const globalShipment=Array.isArray(plan?.shipments)?plan.shipments.find((s:any)=>Array.isArray(s.offerIds)&&s.offerIds.includes(line.offerId)):undefined;
    const merchantRow=await client.query<{merchant_id:string|null}>(`select coalesce(o.merchant_id,p.merchant_id) merchant_id from trust_products p left join trust_marketplace_offers o on o.id=$2 where p.id=$1`,[line.productId,line.offerId??null]);
    const sellerOrderId=merchantRow.rows[0]?.merchant_id?sellerOrderIds.get(String(merchantRow.rows[0].merchant_id))??null:null;
    const orderItem=(await client.query<{id:string}>(`insert into trust_order_items(order_id,product_id,quantity,unit_price,offer_id,seller_order_id) values($1,$2,$3,$4,$5,$6) returning id`,[orderId,line.productId,line.quantity,minorToMajor(BigInt(line.unitPriceMinor),currency),line.offerId??null,sellerOrderId])).rows[0];
    if(!orderItem) throw new Error('ORDER_ITEM_CREATE_FAILED');
    await reserveInventoryTx(client,{
      orderId,
      productId:String(line.productId),
      quantity:Number(line.quantity),
      offerId:line.offerId?String(line.offerId):undefined,
      locationId:globalShipment?.locationId?String(globalShipment.locationId):undefined,
      orderItemId:orderItem.id,
      status:paymentMethod==='cod'?'consumed':'reserved',
    });
    if(line.offerId){
      if(merchantRow.rows[0]?.merchant_id) await recordSellerOrderAcceptedTx(client,String(merchantRow.rows[0].merchant_id),orderId,String(line.offerId));
    }
  }
  const plan=(q.pricing_json as any)?.fulfillmentPlan;
  if(plan?.shipments) for(const shipment of plan.shipments){
    await client.query(`insert into trust_order_shipments(order_id,merchant_id,location_id,destination_region,min_days,max_days,shipping_cost,fulfillment_cost,source,offer_ids) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,[orderId,shipment.merchantId,shipment.locationId??null,shipment.destinationRegion,shipment.minDays,shipment.maxDays,shipment.shippingCost,shipment.fulfillmentCost,shipment.source,JSON.stringify(shipment.offerIds)]);
  }
  const order:GlobalCommittedOrder={id:orderId,customerId:input.customerId,subtotal,shipping,total,currency,status,paymentMethod,idempotentReplay:false,destinationCountry:String(q.destination_country),locale:String(q.locale)};
  await client.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,$3,'global_checkout','V298 global checkout')`,[orderId,null,status]);
  await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('order.created',$1,$2::jsonb)`,[orderId,JSON.stringify(order)]);
  await client.query(`update trust_checkout_quotes set consumed_at=now() where id=$1`,[input.quoteId]);
  await client.query(`insert into trust_idempotency_keys(key_hash,scope,result_json,request_hash,expires_at) values($1,'checkout.global.commit',$2::jsonb,$3,now()+interval '24 hours')`,[hash,JSON.stringify(order),requestHash]);
  return order;
}

function toOrder(row:any):GlobalCommittedOrder{return {id:String(row.id),customerId:row.customer_id?String(row.customer_id):null,subtotal:Number(row.subtotal),shipping:Number(row.shipping),total:Number(row.total),currency:String(row.currency),status:row.status,paymentMethod:row.payment_method,idempotentReplay:false,destinationCountry:String(row.destination_country??''),locale:String(row.locale??'')}}
