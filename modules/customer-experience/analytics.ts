import { query, withPgTransaction } from '../platform/db/postgres';
import { randomUUID } from 'node:crypto';
import { appendAuditTrail, appendTimeline, normalizeOptionalText, normalizeText, positiveInt } from './helpers';

export type CustomerMetric = { key:string; value:number; generatedAt:string };

export async function orderCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from orders where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function lifetimeValue(customerId:string):Promise<any>{
  const result=await query(`select coalesce(sum(total_amount_cents),0)::bigint as value from orders where customer_id=$1 and status not in ('cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function averageOrderValue(customerId:string):Promise<any>{
  const result=await query(`select coalesce(round(avg(total_amount_cents)),0)::bigint as value from orders where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function lastOrderAt(customerId:string):Promise<any>{
  const result=await query(`select max(created_at) as value from orders where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function openOrderCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from orders where customer_id=$1 and status not in ('delivered','cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function returnedOrderCount(customerId:string):Promise<any>{
  const result=await query(`select count(distinct r.order_id)::int as value from trust_returns r where r.customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function refundAmount(customerId:string):Promise<any>{
  const result=await query(`select coalesce(sum(refund_amount_cents),0)::bigint as value from trust_returns where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function reviewCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_reviews where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function publishedReviewCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_reviews where customer_id=$1 and status='PUBLISHED'`,[customerId]);
  return result.rows[0] ?? null;
}

export async function verifiedReviewCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_reviews where customer_id=$1 and verified_purchase`,[customerId]);
  return result.rows[0] ?? null;
}

export async function wishlistItemCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_wishlist_items i join trust_wishlists w on w.id=i.wishlist_id where w.customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function savedCartValue(customerId:string):Promise<any>{
  const result=await query(`select coalesce(sum(i.quantity*i.unit_price_cents),0)::bigint as value from trust_saved_cart_items i join trust_saved_carts c on c.id=i.saved_cart_id where c.customer_id=$1 and c.status='ACTIVE'`,[customerId]);
  return result.rows[0] ?? null;
}

export async function notificationUnreadCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from platform_notifications where recipient_id=$1 and read_at is null`,[customerId]);
  return result.rows[0] ?? null;
}

export async function supportCaseCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_problem_cases where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function supportOpenCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_problem_cases where customer_id=$1 and status not in ('RESOLVED','CLOSED')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function timelineCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_timeline where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function preferenceCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_preferences where customer_id=$1 and enabled`,[customerId]);
  return result.rows[0] ?? null;
}

export async function activeWishlistCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_wishlists where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function activeSavedCartCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_saved_carts where customer_id=$1 and status='ACTIVE'`,[customerId]);
  return result.rows[0] ?? null;
}

export async function privacyJobCount(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_privacy_jobs where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}
