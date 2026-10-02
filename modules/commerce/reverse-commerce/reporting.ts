import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';

export async function reverseCommerceDashboard(db: SqlExecutor) {
  const [returns, recovery, replacements, credits, ledger, jobs] = await Promise.all([
    db.query<any>(`select status,count(*)::int count from trust_returns group by status order by status`),
    db.query<any>(`select disposition,status,count(*)::int count,coalesce(sum(quantity),0)::int quantity from trust_inventory_recovery_actions group by disposition,status order by disposition,status`),
    db.query<any>(`select status,count(*)::int count,coalesce(sum(customer_charge),0)::numeric customer_charge from trust_replacement_orders group by status order by status`),
    db.query<any>(`select status,count(*)::int count,coalesce(sum(original_amount),0)::numeric issued,coalesce(sum(remaining_amount),0)::numeric remaining from trust_store_credits group by status order by status`),
    db.query<any>(`select entry_type,direction,status,count(*)::int count,coalesce(sum(amount),0)::numeric amount from trust_financial_ledger_entries group by entry_type,direction,status order by entry_type,direction,status`),
    db.query<any>(`select job_type,status,count(*)::int count from trust_reverse_commerce_jobs group by job_type,status order by job_type,status`),
  ]);
  return { surfaceStatus: 'LIVE' as const, returns: returns.rows, recovery: recovery.rows, replacements: replacements.rows, credits: credits.rows, ledger: ledger.rows, jobs: jobs.rows, generatedAt: new Date().toISOString() };
}

export async function returnValueExposure(db: SqlExecutor) {
  const result = await db.query<any>(`select
    count(distinct r.id)::int return_count,
    coalesce(sum(s.net_amount),0)::numeric refund_exposure,
    coalesce(sum(case when r.status in ('REQUESTED','APPROVED','RECEIVED','INSPECTING') then 1 else 0 end),0)::int open_returns,
    coalesce(sum(case when r.updated_at < now()-interval '72 hours' and r.status not in ('CLOSED','REJECTED','REFUNDED') then 1 else 0 end),0)::int aging_over_72h
    from trust_returns r left join trust_refund_settlements s on s.return_id=r.id`);
  const row = result.rows[0] || {};
  return { returnCount: Number(row.return_count || 0), refundExposure: Number(row.refund_exposure || 0), openReturns: Number(row.open_returns || 0), agingOver72Hours: Number(row.aging_over_72h || 0) };
}

export async function inventoryRecoveryIntegrity(db: SqlExecutor) {
  const result = await db.query<any>(`select
    count(*) filter(where status='APPLIED')::int applied,
    count(*) filter(where status='REVERSED')::int reversed,
    count(*) filter(where status='FAILED')::int failed,
    coalesce(sum(case when status='APPLIED' then delta else 0 end),0)::int applied_delta,
    coalesce(sum(case when status='REVERSED' then delta else 0 end),0)::int reversed_delta
    from trust_inventory_recovery_actions`);
  const row = result.rows[0] || {};
  return { applied: Number(row.applied || 0), reversed: Number(row.reversed || 0), failed: Number(row.failed || 0), appliedDelta: Number(row.applied_delta || 0), reversedDelta: Number(row.reversed_delta || 0), surfaceStatus: 'LIVE' as const };
}

export async function replacementPipelineHealth(db: SqlExecutor) {
  const result = await db.query<any>(`select
    count(*)::int total,
    count(*) filter(where status='FAILED')::int failed,
    count(*) filter(where status='DELIVERED')::int delivered,
    count(*) filter(where status in ('REQUESTED','APPROVED','RESERVED','CONFIRMED','FULFILLING','SHIPPED'))::int active,
    coalesce(avg(extract(epoch from (updated_at-created_at))/3600) filter(where status='DELIVERED'),0)::numeric avg_hours
    from trust_replacement_orders`);
  const row = result.rows[0] || {};
  return { total: Number(row.total || 0), failed: Number(row.failed || 0), delivered: Number(row.delivered || 0), active: Number(row.active || 0), averageDeliveryHours: Number(row.avg_hours || 0), surfaceStatus: 'LIVE' as const };
}

export async function storeCreditExposure(db: SqlExecutor) {
  const result = await db.query<any>(`select
    count(*)::int credits,
    coalesce(sum(original_amount),0)::numeric issued,
    coalesce(sum(remaining_amount),0)::numeric outstanding,
    coalesce(sum(original_amount-remaining_amount),0)::numeric redeemed
    from trust_store_credits where status in ('ACTIVE','EXHAUSTED')`);
  const row = result.rows[0] || {};
  return { credits: Number(row.credits || 0), issued: Number(row.issued || 0), outstanding: Number(row.outstanding || 0), redeemed: Number(row.redeemed || 0), surfaceStatus: 'LIVE' as const };
}
