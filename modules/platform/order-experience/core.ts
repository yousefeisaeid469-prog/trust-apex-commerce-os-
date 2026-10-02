import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, type OrderTimelineStatus, type OrderActionState } from './contracts.ts';

export function buildOrderTimeline(events: Array<{status:string; createdAt:string}>, currentStatus:string) {
  const safe = events.filter(e => e && e.status in ORDER_STATUS_LABELS).map(e => ({status:e.status as OrderTimelineStatus, at:e.createdAt}));
  if (!safe.some(e => e.status === currentStatus) && currentStatus in ORDER_STATUS_LABELS) safe.unshift({status:currentStatus as OrderTimelineStatus, at:new Date().toISOString()});
  const seen = new Set<string>();
  return safe.filter(e => !seen.has(`${e.status}|${e.at}`)).map(e => ({status:e.status, label:ORDER_STATUS_LABELS[e.status], at:e.at, current:e.status===currentStatus}));
}

export function getOrderActions(status: string): OrderActionState[] {
  const cancellable = status === 'pending' || status === 'confirmed';
  return [
    { action:'cancel', allowed:cancellable, ...(cancellable ? {} : {reason:'ORDER_NOT_CANCELLABLE'}) },
    { action:'track', allowed:ORDER_STATUS_STEPS.includes(status as OrderTimelineStatus) || status === 'delivered', ...(status === 'pending' ? {reason:'TRACKING_NOT_AVAILABLE_YET'} : {}) },
  ];
}

export function normalizeOrderList(rows: any[]) {
  return rows.map(row => ({
    id:String(row.id), status:String(row.status) as OrderTimelineStatus,
    subtotal:Number(row.subtotal), shipping:Number(row.shipping), total:Number(row.total), currency:String(row.currency || 'EGP'),
    paymentMethod:String(row.payment_method || 'cod'), createdAt:String(row.created_at),
  }));
}
