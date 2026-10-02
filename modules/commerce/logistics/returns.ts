export type ReturnEligibility = { eligible: boolean; windowDays: number; reason: string };
export function evaluateReturn(orderCreatedAt: string, now = new Date()): ReturnEligibility {
  const ageDays = Math.floor((now.getTime() - new Date(orderCreatedAt).getTime()) / 86400000);
  const windowDays = 30;
  if (!Number.isFinite(ageDays) || ageDays < 0) return { eligible: false, windowDays, reason: 'INVALID_ORDER_DATE' };
  if (ageDays > windowDays) return { eligible: false, windowDays, reason: 'RETURN_WINDOW_EXPIRED' };
  return { eligible: true, windowDays, reason: 'WITHIN_RETURN_WINDOW' };
}
