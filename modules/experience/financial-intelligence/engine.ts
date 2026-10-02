export interface TotalCostInput { itemPrice: number; shipping?: number; fees?: number; expectedReturnCost?: number; expectedMaintenance?: number; expectedLifespanMonths?: number; currency: string; }
export interface TotalCostResult { upfront: number; expectedLifecycleCost: number; monthlyEquivalent: number | null; currency: string; assumptions: string[]; }
export function calculateTotalCost(i: TotalCostInput): TotalCostResult {
  const upfront = i.itemPrice + (i.shipping ?? 0) + (i.fees ?? 0);
  const lifecycle = upfront + (i.expectedReturnCost ?? 0) + (i.expectedMaintenance ?? 0);
  const monthlyEquivalent = i.expectedLifespanMonths && i.expectedLifespanMonths > 0 ? lifecycle / i.expectedLifespanMonths : null;
  return { upfront, expectedLifecycleCost: lifecycle, monthlyEquivalent, currency: i.currency, assumptions: ['Lifecycle values are estimates, not guaranteed savings.', 'Missing provider data is never treated as zero-cost proof.'] };
}
export function affordabilitySignal(total: number, budget?: number) { if (budget === undefined) return { status: 'UNKNOWN' as const, ratio: null }; const ratio = total / budget; return { status: ratio <= .7 ? 'COMFORTABLE' as const : ratio <= 1 ? 'STRETCH' as const : 'OVER_BUDGET' as const, ratio }; }
