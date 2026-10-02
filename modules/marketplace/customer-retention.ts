import { query, withPgTransaction } from '../platform/db/postgres';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';

const clean=(v:unknown,max=240)=>String(v??'').trim().slice(0,max);
const int=(v:unknown,d=0)=>Number.isFinite(Number(v))?Math.floor(Number(v)):d;
const money=(v:unknown)=>Math.max(0,Number.isFinite(Number(v))?Number(v):0);

export async function listProductReviews(productId:string){
  const r=await query(`select id,product_id,customer_id,rating,title,body,verified_purchase,status,helpful_count,created_at from trust_reviews where product_id=$1 and status='PUBLISHED' order by verified_purchase desc,helpful_count desc,created_at desc limit 50`,[clean(productId,80)]);
  const stats=await query(`select count(*)::int review_count,coalesce(avg(rating),0)::numeric(4,2) rating_average,count(*) filter(where verified_purchase=true)::int verified_count from trust_reviews where product_id=$1 and status='PUBLISHED'`,[clean(productId,80)]);
  return {reviews:r.rows.map((x:any)=>({id:String(x.id),productId:String(x.product_id),rating:Number(x.rating),title:x.title??undefined,body:x.body??undefined,verifiedPurchase:Boolean(x.verified_purchase),helpfulCount:Number(x.helpful_count),createdAt:new Date(x.created_at).toISOString()})),summary:{reviewCount:Number(stats.rows[0]?.review_count??0),ratingAverage:Number(stats.rows[0]?.rating_average??0),verifiedCount:Number(stats.rows[0]?.verified_count??0)}};
}

export async function submitProductReview(input:{productId:string;customerId:string;rating:number;title?:string;body?:string}){
  const productId=clean(input.productId,80),customerId=clean(input.customerId,80),rating=int(input.rating);
  if(!productId||!customerId||rating<1||rating>5)throw new Error('INVALID_REVIEW');
  const purchase=await query(`select 1 from trust_order_items oi join trust_orders o on o.id=oi.order_id where oi.product_id=$1 and o.customer_id=$2 and o.status in ('confirmed','processing','shipped','delivered') limit 1`,[productId,customerId]);
  const verified=purchase.rows.length>0;
  const r=await query(`insert into trust_reviews(product_id,customer_id,rating,title,body,verified_purchase,status,helpful_count) values($1,$2,$3,$4,$5,$6,'PUBLISHED',0) on conflict(product_id,customer_id) do update set rating=excluded.rating,title=excluded.title,body=excluded.body,verified_purchase=excluded.verified_purchase,status='PUBLISHED' returning id,product_id,rating,title,body,verified_purchase,status,helpful_count,created_at`,[productId,customerId,rating,clean(input.title,140)||null,clean(input.body,2000)||null,verified]);
  return r.rows[0];
}

export async function voteReviewHelpful(reviewId:string,customerId:string){
  const r=await withPgTransaction(async client=>{
    const inserted=await client.query(`insert into trust_review_helpful_votes(review_id,customer_id) values($1,$2) on conflict do nothing returning review_id`,[reviewId,customerId]);
    if(!inserted.rows[0]) return {changed:false};
    const updated=await client.query(`update trust_reviews set helpful_count=helpful_count+1 where id=$1 returning helpful_count`,[reviewId]);
    return {changed:true,helpfulCount:Number(updated.rows[0]?.helpful_count??0)};
  });
  return r;
}

// These three now write to trust_wishlists/trust_wishlist_items — the same
// tables the customer dashboard reads (modules/customer-experience/wishlist.ts).
// Before this fix they wrote to a separate trust_marketplace_wishlists table
// that the dashboard never read: a customer tapping "add to wishlist" on a
// product page would never see that item in their own account dashboard.
// Each customer gets one auto-provisioned default list ('My Wishlist') so the
// simple add/remove-by-product UI doesn't need to know about named lists.
async function defaultWishlistIdTx(client: PoolClient, customerId: string) {
  const existing = await client.query<{ id: string }>(`select id from trust_wishlists where customer_id=$1 order by created_at asc limit 1`, [customerId]);
  if (existing.rows[0]) return existing.rows[0].id;
  const newId = randomUUID();
  await client.query(`insert into trust_wishlists(id,customer_id,name,visibility) values($1,$2,'My Wishlist','PRIVATE')`, [newId, customerId]);
  return newId;
}

export async function addWishlist(customerId:string,productId:string){
  if(!clean(customerId)||!clean(productId))throw new Error('CUSTOMER_PRODUCT_REQUIRED');
  return withPgTransaction(async client=>{
    const wishlistId=await defaultWishlistIdTx(client,customerId);
    // No expression-based unique index exists for (wishlist_id,product_id) with
    // a null variant_id (Postgres treats NULLs as distinct in a plain unique
    // constraint), so ON CONFLICT can't target this correctly — check-then-insert
    // under a row lock instead.
    await client.query(`select id from trust_wishlists where id=$1 for update`,[wishlistId]);
    const existing=await client.query<{id:string}>(`select id from trust_wishlist_items where wishlist_id=$1 and product_id=$2 and variant_id is null`,[wishlistId,productId]);
    if(existing.rows[0]) return {id:existing.rows[0].id,wishlist_id:wishlistId,product_id:productId};
    const newItemId=randomUUID();
    const r=await client.query(`insert into trust_wishlist_items(id,wishlist_id,product_id,priority) values($1,$2,$3,1) returning *`,[newItemId,wishlistId,productId]);
    return r.rows[0];
  });
}
export async function removeWishlist(customerId:string,productId:string){
  return withPgTransaction(async client=>{
    const wishlistId=await defaultWishlistIdTx(client,customerId);
    await client.query(`delete from trust_wishlist_items where wishlist_id=$1 and product_id=$2`,[wishlistId,productId]);
    return {removed:true};
  });
}
export async function listWishlist(customerId:string){
  const r=await query(
    `select i.product_id,p.name,p.price,p.old_price,p.image,p.rating,p.stock,i.added_at as created_at
     from trust_wishlists w join trust_wishlist_items i on i.wishlist_id=w.id join trust_products p on p.id=i.product_id
     where w.customer_id=$1 and p.active=true order by i.added_at desc`,
    [customerId]
  );
  return r.rows;
}

export async function createPriceAlert(input:{customerId:string;productId:string;targetPrice:number}){
  const target=money(input.targetPrice);if(!clean(input.customerId)||!clean(input.productId)||target<=0)throw new Error('INVALID_PRICE_ALERT');
  const r=await query(`insert into trust_marketplace_price_alerts(customer_id,product_id,target_price,status) values($1,$2,$3,'ACTIVE') on conflict(customer_id,product_id) do update set target_price=excluded.target_price,status='ACTIVE',triggered_at=null,updated_at=now() returning *`,[input.customerId,input.productId,target]);
  return r.rows[0];
}
export async function removePriceAlert(customerId:string,productId:string){await query(`delete from trust_marketplace_price_alerts where customer_id=$1 and product_id=$2`,[customerId,productId]);return {removed:true};}
export async function listPriceAlerts(customerId:string){const r=await query(`select a.*,p.name,p.price,p.image from trust_marketplace_price_alerts a join trust_products p on p.id=a.product_id where a.customer_id=$1 order by a.created_at desc`,[customerId]);return r.rows;}

export async function getLoyaltyAccount(customerId:string){
  const r=await query(`insert into trust_marketplace_loyalty_accounts(customer_id,tier,points,lifetime_points) values($1,'STANDARD',0,0) on conflict(customer_id) do update set customer_id=excluded.customer_id returning *`,[customerId]);
  return r.rows[0];
}
export async function awardLoyaltyPoints(input:{customerId:string;points:number;reason:string;idempotencyKey:string}){
  const points=Math.max(0,int(input.points));if(points<=0||!clean(input.customerId)||!clean(input.idempotencyKey))throw new Error('INVALID_LOYALTY_AWARD');
  return withPgTransaction(async client=>{
    const ins=await client.query(`insert into trust_marketplace_loyalty_ledger(customer_id,points,reason,idempotency_key) values($1,$2,$3,$4) on conflict(idempotency_key) do nothing returning id`,[input.customerId,points,clean(input.reason,180),input.idempotencyKey]);
    if(!ins.rows[0]) { const existing=await client.query(`select * from trust_marketplace_loyalty_accounts where customer_id=$1`,[input.customerId]); if(existing.rows[0]) return existing.rows[0]; return (await client.query(`insert into trust_marketplace_loyalty_accounts(customer_id,tier,points,lifetime_points) values($1,'STANDARD',0,0) returning *`,[input.customerId])).rows[0]; }
    const r=await client.query(`insert into trust_marketplace_loyalty_accounts(customer_id,tier,points,lifetime_points) values($1,'STANDARD',$2,$2) on conflict(customer_id) do update set points=trust_marketplace_loyalty_accounts.points+$2,lifetime_points=trust_marketplace_loyalty_accounts.lifetime_points+$2,updated_at=now() returning *`,[input.customerId,points]);
    return r.rows[0];
  });
}
