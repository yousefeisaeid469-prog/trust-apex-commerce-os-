import { withPgTransaction } from '../db/postgres';

const clean=(v:unknown,max=180)=>String(v??'').trim().slice(0,max);

// wishlistSnapshot and mutateWishlist wrote/read trust_marketplace_wishlists
// directly — a table the customer dashboard never queried — and their only
// caller, /api/wishlist, had zero frontend callers anywhere in the app.
// Removed. The live wishlist path is modules/marketplace/customer-retention.ts,
// which writes to trust_wishlists/trust_wishlist_items — the table the
// dashboard actually reads. See AUDIT-V329.md for the full trace.
//
// customerCommerceSummary (also removed here) called wishlistSnapshot() and
// an undefined getLoyaltyAccount() with no import for query() either — a
// leftover from a previous incomplete edit that would have failed to
// compile. It had zero callers anywhere in the app, so removing it is safe;
// nothing depended on the broken function ever running.

export async function earnDeliveredOrderPoints(input:{customerId:string;orderId:string;idempotencyKey:string}){
  const customerId=clean(input.customerId), orderId=clean(input.orderId), key=clean(input.idempotencyKey,220);
  if(!customerId||!orderId) throw new Error('CUSTOMER_ORDER_REQUIRED');
  if(!key) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  const base=Number(process.env.TRUST_LOYALTY_POINTS_PER_100_EGP||1);
  if(!Number.isFinite(base)||base<=0) throw new Error('INVALID_LOYALTY_POLICY');
  return withPgTransaction(async tx=>{
    const existing=await tx.query<any>('select * from trust_marketplace_loyalty_ledger where idempotency_key=$1 for update',[key]);
    if(existing.rows[0]) return {replay:true,points:Number(existing.rows[0].points),reason:existing.rows[0].reason};
    const order=await tx.query<{id:string;customer_id:string;status:string;subtotal:string;currency:string}>(`select id,customer_id,status,subtotal,currency from trust_orders where id=$1 for update`,[orderId]);
    if(!order.rows[0]) throw new Error('ORDER_NOT_FOUND');
    if(order.rows[0].customer_id!==customerId) throw new Error('ORDER_NOT_OWNED');
    if(order.rows[0].status!=='delivered') throw new Error('ORDER_NOT_DELIVERED');
    if(String(order.rows[0].currency).toUpperCase()!=='EGP') throw new Error('LOYALTY_CURRENCY_UNSUPPORTED');
    const points=Math.floor((Number(order.rows[0].subtotal)/100)*base);
    if(!Number.isFinite(points)||points<=0) return {replay:false,points:0,reason:'ORDER_BELOW_LOYALTY_THRESHOLD'};
    const reason=`PURCHASE:${orderId}`;
    await tx.query(`insert into trust_marketplace_loyalty_ledger(customer_id,points,reason,idempotency_key) values($1,$2,$3,$4)`,[customerId,points,reason,key]);
    const account=(await tx.query(`insert into trust_marketplace_loyalty_accounts(customer_id,tier,points,lifetime_points) values($1,'STANDARD',$2,$2) on conflict(customer_id) do update set points=trust_marketplace_loyalty_accounts.points+$2,lifetime_points=trust_marketplace_loyalty_accounts.lifetime_points+$2,updated_at=now() returning *`,[customerId,points])).rows[0];
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('customer.loyalty.points.earned',$1,$2::jsonb)`,[customerId,JSON.stringify({customerId,orderId,points,currency:order.rows[0].currency,source:'delivered_order'})]);
    return {replay:false,points,reason,account};
  });
}
