export type BillingState='trialing'|'active'|'past_due'|'paused'|'cancelled';
const transitions:Record<BillingState,ReadonlySet<BillingState>>={
 trialing:new Set(['active','cancelled']),active:new Set(['past_due','paused','cancelled']),past_due:new Set(['active','paused','cancelled']),paused:new Set(['active','cancelled']),cancelled:new Set()
};
export function transitionBilling(from:BillingState,to:BillingState){if(!transitions[from].has(to))throw new Error(`INVALID_BILLING_TRANSITION:${from}->${to}`);return to}
