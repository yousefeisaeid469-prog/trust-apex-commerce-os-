export type RightType = 'PRICE' | 'DELIVERY' | 'AUTHENTICITY' | 'RETURNS' | 'WARRANTY' | 'PAYMENT' | 'DISCLOSURE';
export type RightsStatus = 'CLEAR' | 'REVIEW' | 'BLOCKED' | 'UNKNOWN';
export interface RightsEvidence { source: string; observedAt: string; confidence: number; note: string; }
export interface RightsCheck { id: string; type: RightType; status: RightsStatus; confidence: number; evidence: RightsEvidence[]; action: 'CONTINUE' | 'ASK_SELLER' | 'HOLD' | 'ESCALATE'; }
export interface RightsReport { checks: RightsCheck[]; overall: RightsStatus; explanation: string[]; requiresHumanReview: boolean; }
export function evaluateRights(input: { priceKnown?: boolean; returnPolicyKnown?: boolean; warrantyKnown?: boolean; sellerVerified?: boolean; deliveryPromiseKnown?: boolean; authenticityEvidence?: boolean; paymentProviderKnown?: boolean; }): RightsReport {
  const checks: RightsCheck[] = [
    { id: 'price', type: 'PRICE', status: input.priceKnown === false ? 'REVIEW' : input.priceKnown ? 'CLEAR' : 'UNKNOWN', confidence: input.priceKnown === undefined ? .35 : .9, evidence: [], action: input.priceKnown === false ? 'ASK_SELLER' : 'CONTINUE' },
    { id: 'delivery', type: 'DELIVERY', status: input.deliveryPromiseKnown === false ? 'REVIEW' : input.deliveryPromiseKnown ? 'CLEAR' : 'UNKNOWN', confidence: input.deliveryPromiseKnown === undefined ? .35 : .9, evidence: [], action: input.deliveryPromiseKnown === false ? 'ASK_SELLER' : 'CONTINUE' },
    { id: 'authenticity', type: 'AUTHENTICITY', status: input.authenticityEvidence === false ? 'REVIEW' : input.authenticityEvidence ? 'CLEAR' : 'UNKNOWN', confidence: input.authenticityEvidence === undefined ? .3 : .88, evidence: [], action: input.authenticityEvidence === false ? 'HOLD' : 'CONTINUE' },
    { id: 'returns', type: 'RETURNS', status: input.returnPolicyKnown === false ? 'REVIEW' : input.returnPolicyKnown ? 'CLEAR' : 'UNKNOWN', confidence: input.returnPolicyKnown === undefined ? .3 : .9, evidence: [], action: input.returnPolicyKnown === false ? 'ASK_SELLER' : 'CONTINUE' },
    { id: 'warranty', type: 'WARRANTY', status: input.warrantyKnown === false ? 'REVIEW' : input.warrantyKnown ? 'CLEAR' : 'UNKNOWN', confidence: input.warrantyKnown === undefined ? .3 : .86, evidence: [], action: input.warrantyKnown === false ? 'ASK_SELLER' : 'CONTINUE' },
    { id: 'payment', type: 'PAYMENT', status: input.paymentProviderKnown === false ? 'REVIEW' : input.paymentProviderKnown ? 'CLEAR' : 'UNKNOWN', confidence: input.paymentProviderKnown === undefined ? .4 : .92, evidence: [], action: input.paymentProviderKnown === false ? 'HOLD' : 'CONTINUE' },
    { id: 'seller-disclosure', type: 'DISCLOSURE', status: input.sellerVerified === false ? 'REVIEW' : input.sellerVerified ? 'CLEAR' : 'UNKNOWN', confidence: input.sellerVerified === undefined ? .35 : .9, evidence: [], action: input.sellerVerified === false ? 'ESCALATE' : 'CONTINUE' },
  ];
  const risky = checks.filter(c => c.status === 'REVIEW' || c.status === 'BLOCKED');
  const unknown = checks.filter(c => c.status === 'UNKNOWN');
  const overall: RightsStatus = risky.length ? 'REVIEW' : unknown.length ? 'UNKNOWN' : 'CLEAR';
  return { checks, overall, requiresHumanReview: risky.length >= 2 || checks.some(c => c.action === 'ESCALATE'), explanation: risky.length ? ['One or more consumer-rights signals need evidence before proceeding.'] : unknown.length ? ['Some protections cannot be verified from the available data.'] : ['Core purchase protections have supporting inputs.'] };
}
