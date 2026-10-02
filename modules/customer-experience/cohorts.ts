import { query, withPgTransaction } from '../platform/db/postgres';
import { randomUUID } from 'node:crypto';
import { appendAuditTrail, appendTimeline, normalizeOptionalText, normalizeText, positiveInt } from './helpers';

export type CustomerMetric = { key:string; value:number; generatedAt:string };

export async function daysSinceLastOrder(customerId:string):Promise<any>{
  const result=await query(`select coalesce(extract(day from now()-max(created_at)),999999)::int as value from orders where customer_id=$1`,[customerId]);
  return result.rows[0] ?? null;
}

export async function ordersLast30Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from orders where customer_id=$1 and created_at>=now()-interval '30 days' and status not in ('cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function ordersLast90Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from orders where customer_id=$1 and created_at>=now()-interval '90 days' and status not in ('cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function spendLast30Days(customerId:string):Promise<any>{
  const result=await query(`select coalesce(sum(total_amount_cents),0)::bigint as value from orders where customer_id=$1 and created_at>=now()-interval '30 days' and status not in ('cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function spendLast90Days(customerId:string):Promise<any>{
  const result=await query(`select coalesce(sum(total_amount_cents),0)::bigint as value from orders where customer_id=$1 and created_at>=now()-interval '90 days' and status not in ('cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function reviewsLast90Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from orders where customer_id=$1 and created_at>=now()-interval '90 days' and status not in ('cancelled','refunded')`,[customerId]);
  return result.rows[0] ?? null;
}

export async function timelineLast7Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_timeline where customer_id=$1 and occurred_at>=now()-interval '7 days'`,[customerId]);
  return result.rows[0] ?? null;
}

export async function timelineLast30Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_customer_timeline where customer_id=$1 and occurred_at>=now()-interval '30 days'`,[customerId]);
  return result.rows[0] ?? null;
}

export async function supportCasesLast30Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_problem_cases where customer_id=$1 and created_at>=now()-interval '30 days'`,[customerId]);
  return result.rows[0] ?? null;
}

export async function returnsLast90Days(customerId:string):Promise<any>{
  const result=await query(`select count(*)::int as value from trust_returns where customer_id=$1 and created_at>=now()-interval '90 days'`,[customerId]);
  return result.rows[0] ?? null;
}
