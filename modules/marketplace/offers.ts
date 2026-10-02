import { query, withPgTransaction } from '../platform/db/postgres';
import { getSellerTrustBatch } from './seller-intelligence';
import { adjustInventoryTransactionTx } from '../commerce/inventory/transaction-engine';

export type FulfillmentMode = 'TRUST_FULFILLED'|'MERCHANT_FULFILLED'|'PARTNER_FULFILLED';
export type Offer = {
  id:string; catalogItemId:string; productId:string; merchantId:string; storeName:string;
  price:number; shippingFee:number; stock:number; handlingDays:number;
  deliveryMinDays:number; deliveryMaxDays:number; fulfillmentMode:FulfillmentMode;
  sellerRating:number; sellerOrders:number; returnRateBps:number; status:string; revision:number;
};

export type OfferStatus = 'ACTIVE'|'PAUSED'|'SUSPENDED';
export type OfferUpdate = {
  price?: number; shippingFee?: number; stock?: number; handlingDays?: number;
  deliveryMinDays?: number; deliveryMaxDays?: number; fulfillmentMode?: FulfillmentMode;
  status?: OfferStatus; expectedRevision?: number; actorUserId?: string;
};

const n=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clean=(v:unknown,max=160)=>String(v??'').trim().slice(0,max);

function buyBoxScore(o:Offer, lowestPrice:number, maxDelivery:number, trustScore=50){
  const priceScore=lowestPrice>0?Math.min(1,lowestPrice/Math.max(o.price,0.01)):0;
  const sellerScore=Math.min(1,Math.max(0,trustScore/100));
  const fulfillmentScore=o.fulfillmentMode==='TRUST_FULFILLED'?1:o.fulfillmentMode==='PARTNER_FULFILLED'?.8:.6;
  const deliveryScore=maxDelivery>0?Math.max(0,1-(o.deliveryMaxDays/maxDelivery)*.65):1;
  const availability=o.stock>0?1:0;
  const returns=Math.max(0,1-o.returnRateBps/10000);
  return priceScore*.32+sellerScore*.24+fulfillmentScore*.18+deliveryScore*.14+availability*.08+returns*.04;
}

export async function listOffers(catalogItemId:string){
  const rows=await query(`select o.*,m.store_name from trust_marketplace_offers o join trust_merchant_profiles m on m.id=o.merchant_id where o.catalog_item_id=$1 and o.status='ACTIVE' order by o.price asc,o.seller_rating desc,o.delivery_max_days asc,o.id asc`,[catalogItemId]);
  return rows.rows.map(mapOffer);
}

function mapOffer(r:any):Offer{return {id:String(r.id),catalogItemId:String(r.catalog_item_id),productId:String(r.product_id),merchantId:String(r.merchant_id),storeName:String(r.store_name??''),price:n(r.price),shippingFee:n(r.shipping_fee),stock:n(r.stock),handlingDays:n(r.handling_days),deliveryMinDays:n(r.delivery_min_days),deliveryMaxDays:n(r.delivery_max_days),fulfillmentMode:r.fulfillment_mode,sellerRating:n(r.seller_rating),sellerOrders:n(r.seller_orders),returnRateBps:n(r.return_rate_bps),status:String(r.status),revision:Math.max(1,Number(r.revision??1))}}

export async function resolveBuyBox(catalogItemId:string){
  const offers=await listOffers(catalogItemId);
  const active=offers.filter(o=>o.stock>0);
  const trust=await getSellerTrustBatch(active.map(o=>o.merchantId));
  if(!active.length)return {offer:undefined,score:0,reason:[],offers};
  const lowest=Math.min(...active.map(o=>o.price+o.shippingFee));
  const maxDelivery=Math.max(...active.map(o=>o.deliveryMaxDays),1);
  const ranked=active.map(o=>{const sellerTrust=trust.get(o.merchantId)??undefined; return {offer:o, sellerTrust, score:buyBoxScore(o,lowest,maxDelivery,sellerTrust?.trustScore??50)}}).sort((a,b)=>b.score-a.score||(a.offer.price+a.offer.shippingFee)-(b.offer.price+b.offer.shippingFee)||a.offer.id.localeCompare(b.offer.id));
  const winner=ranked[0];
  const reason={price:winner.offer.price+winner.offer.shippingFee,sellerRating:winner.offer.sellerRating,fulfillment:winner.offer.fulfillmentMode,delivery:[winner.offer.deliveryMinDays,winner.offer.deliveryMaxDays],stock:winner.offer.stock,returnRateBps:winner.offer.returnRateBps};
  await query(`insert into trust_marketplace_buybox_snapshots(catalog_item_id,offer_id,score,reason_json) values($1,$2,$3,$4::jsonb)`,[catalogItemId,winner.offer.id,winner.score,JSON.stringify(reason)]).catch(()=>undefined);
  return {offer:winner.offer,score:winner.score,reason,offers};
}

export async function getProductMarketplaceContext(productId:string){
  const r=await query(`select o.catalog_item_id from trust_marketplace_offers o where o.product_id=$1 limit 1`,[productId]);
  if(!r.rows[0])return undefined;
  return resolveBuyBox(String(r.rows[0].catalog_item_id));
}

export async function createOffer(input:{catalogItemId?:string;productId:string;merchantId:string;price:number;shippingFee?:number;stock?:number;handlingDays?:number;deliveryMinDays?:number;deliveryMaxDays?:number;fulfillmentMode?:FulfillmentMode}){
  const p=n(input.price); if(p<=0)throw new Error('OFFER_PRICE_REQUIRED');
  const mode=input.fulfillmentMode??'MERCHANT_FULFILLED';
  if(!['TRUST_FULFILLED','MERCHANT_FULFILLED','PARTNER_FULFILLED'].includes(mode))throw new Error('INVALID_FULFILLMENT_MODE');
  return withPgTransaction(async client=>{
    const owner=await client.query(`select 1 from trust_products where id=$1 and merchant_id=$2 and active=true`,[input.productId,input.merchantId]);
    if(!owner.rows[0])throw new Error('PRODUCT_MERCHANT_MISMATCH');
    let catalogId=input.catalogItemId?clean(input.catalogItemId):'';
    if(!catalogId){const existing=await client.query(`select catalog_item_id from trust_marketplace_offers where product_id=$1 limit 1`,[input.productId]); catalogId=String(existing.rows[0]?.catalog_item_id??'');}
    if(!catalogId) throw new Error('CATALOG_ITEM_REQUIRED');
    const row=await client.query(`insert into trust_marketplace_offers(catalog_item_id,product_id,merchant_id,price,shipping_fee,stock,handling_days,delivery_min_days,delivery_max_days,fulfillment_mode) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,[catalogId,clean(input.productId),clean(input.merchantId),p,n(input.shippingFee),Math.max(0,Math.floor(n(input.stock))),Math.max(0,Math.floor(n(input.handlingDays,1))),Math.max(0,Math.floor(n(input.deliveryMinDays,2))),Math.max(0,Math.floor(n(input.deliveryMaxDays,5))),mode]);
    return mapOffer(row.rows[0]);
  });
}


const offerSnapshot = (r:any) => ({
  price:Number(r.price), shippingFee:Number(r.shipping_fee), stock:Number(r.stock),
  handlingDays:Number(r.handling_days), deliveryMinDays:Number(r.delivery_min_days),
  deliveryMaxDays:Number(r.delivery_max_days), fulfillmentMode:String(r.fulfillment_mode),
  status:String(r.status), revision:Number(r.revision)
});

function validateOfferUpdate(input:OfferUpdate){
  if(input.price!==undefined && (!Number.isFinite(input.price)||input.price<=0)) throw new Error('INVALID_OFFER_PRICE');
  if(input.shippingFee!==undefined && (!Number.isFinite(input.shippingFee)||input.shippingFee<0)) throw new Error('INVALID_SHIPPING_FEE');
  if(input.stock!==undefined && (!Number.isInteger(input.stock)||input.stock<0)) throw new Error('INVALID_OFFER_STOCK');
  if(input.handlingDays!==undefined && (!Number.isInteger(input.handlingDays)||input.handlingDays<0||input.handlingDays>30)) throw new Error('INVALID_HANDLING_DAYS');
  if(input.deliveryMinDays!==undefined && (!Number.isInteger(input.deliveryMinDays)||input.deliveryMinDays<0||input.deliveryMinDays>60)) throw new Error('INVALID_DELIVERY_MIN');
  if(input.deliveryMaxDays!==undefined && (!Number.isInteger(input.deliveryMaxDays)||input.deliveryMaxDays<0||input.deliveryMaxDays>90)) throw new Error('INVALID_DELIVERY_MAX');
  if(input.deliveryMinDays!==undefined && input.deliveryMaxDays!==undefined && input.deliveryMaxDays<input.deliveryMinDays) throw new Error('INVALID_DELIVERY_WINDOW');
  if(input.fulfillmentMode!==undefined && !['TRUST_FULFILLED','MERCHANT_FULFILLED','PARTNER_FULFILLED'].includes(input.fulfillmentMode)) throw new Error('INVALID_FULFILLMENT_MODE');
  if(input.status!==undefined && !['ACTIVE','PAUSED','SUSPENDED'].includes(input.status)) throw new Error('INVALID_OFFER_STATUS');
  if(input.expectedRevision!==undefined && (!Number.isInteger(input.expectedRevision)||input.expectedRevision<1)) throw new Error('INVALID_EXPECTED_REVISION');
}

export async function listMerchantOffers(merchantId:string, options:{status?:OfferStatus;limit?:number;cursor?:string}={}){
  const limit=Math.min(100,Math.max(1,Math.floor(options.limit??50)));
  const params:any[]=[merchantId,limit+1];
  const where=['o.merchant_id=$1'];
  if(options.status){params.push(options.status);where.push(`o.status=$${params.length}`);}
  if(options.cursor){params.push(options.cursor);where.push(`o.id>$${params.length}`);}
  const rows=await query(`select o.*,m.store_name from trust_marketplace_offers o join trust_merchant_profiles m on m.id=o.merchant_id where ${where.join(' and ')} order by o.id asc limit $2`,params);
  const page=rows.rows.slice(0,limit).map(mapOffer);
  return {items:page,nextCursor:rows.rows.length>limit?page[page.length-1]?.id:undefined,limit};
}

export async function updateMerchantOffer(input:{offerId:string;merchantId:string;actorUserId?:string;changes:OfferUpdate}){
  const changes=input.changes;
  validateOfferUpdate(changes);
  return withPgTransaction(async client=>{
    const current=await client.query<any>(`select o.*,m.store_name from trust_marketplace_offers o join trust_merchant_profiles m on m.id=o.merchant_id where o.id=$1 and o.merchant_id=$2 for update`,[input.offerId,input.merchantId]);
    const before=current.rows[0];
    if(!before) throw new Error('OFFER_NOT_FOUND');
    if(changes.expectedRevision!==undefined && Number(before.revision)!==changes.expectedRevision) throw new Error('OFFER_REVISION_CONFLICT');
    if(before.status==='SUSPENDED' && changes.status!=='ACTIVE') throw new Error('SUSPENDED_OFFER_REQUIRES_REACTIVATION');
    const next={
      price:changes.price??Number(before.price), shipping_fee:changes.shippingFee??Number(before.shipping_fee),
      stock:changes.stock??Number(before.stock), handling_days:changes.handlingDays??Number(before.handling_days),
      delivery_min_days:changes.deliveryMinDays??Number(before.delivery_min_days), delivery_max_days:changes.deliveryMaxDays??Number(before.delivery_max_days),
      fulfillment_mode:changes.fulfillmentMode??before.fulfillment_mode, status:changes.status??before.status
    };
    if(next.delivery_max_days<next.delivery_min_days) throw new Error('INVALID_DELIVERY_WINDOW');
    const revision=Number(before.revision)+1;
    const stockDelta = Number(next.stock) - Number(before.stock);
    if (stockDelta !== 0) await adjustInventoryTransactionTx(client, { productId: String(before.product_id), offerId: input.offerId, delta: stockDelta, idempotencyKey: `offer-stock:${input.offerId}:${revision}`, source: 'MERCHANT_OFFER_STOCK_ADJUSTMENT', metadata: { merchantId: input.merchantId, actorUserId: input.actorUserId ?? null } });
    const updated=await client.query<any>(`update trust_marketplace_offers set price=$1,shipping_fee=$2,handling_days=$3,delivery_min_days=$4,delivery_max_days=$5,fulfillment_mode=$6,status=$7,revision=$8,updated_at=now() where id=$9 and merchant_id=$10 and revision=$11 returning *, (select store_name from trust_merchant_profiles where id=merchant_id) as store_name`,[next.price,next.shipping_fee,next.handling_days,next.delivery_min_days,next.delivery_max_days,next.fulfillment_mode,next.status,revision,input.offerId,input.merchantId,before.revision]);
    if(!updated.rows[0]) throw new Error('OFFER_REVISION_CONFLICT');
    const after=(await client.query<any>(`select o.*,m.store_name from trust_marketplace_offers o join trust_merchant_profiles m on m.id=o.merchant_id where o.id=$1`,[input.offerId])).rows[0];
    const changeType=changes.status!==undefined&&changes.status!==before.status?'STATUS_CHANGED':changes.stock!==undefined&&Object.keys(changes).every(k=>['stock','expectedRevision','actorUserId'].includes(k))?'STOCK_ADJUSTED':'UPDATED';
    await client.query(`insert into trust_marketplace_offer_change_log(offer_id,merchant_id,actor_user_id,revision,change_type,before_json,after_json) values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,[input.offerId,input.merchantId,input.actorUserId??null,revision,changeType,JSON.stringify(offerSnapshot(before)),JSON.stringify(offerSnapshot(after))]);
    return mapOffer(after);
  });
}

export async function getMerchantOfferHistory(offerId:string, merchantId:string, limit=50){
  const safeLimit=Math.min(100,Math.max(1,Math.floor(limit)));
  const rows=await query(`select l.id,l.offer_id,l.revision,l.change_type,l.before_json,l.after_json,l.actor_user_id,l.created_at from trust_marketplace_offer_change_log l where l.offer_id=$1 and l.merchant_id=$2 order by l.revision desc limit $3`,[offerId,merchantId,safeLimit]);
  return rows.rows;
}
