export type TrustPromise = 'price' | 'delivery' | 'authenticity' | 'returns' | 'support';
export type Benefit = { id: string; title: string; description: string; promise: TrustPromise; enabled: boolean };
export type SwitchingScore = { score: number; reasons: string[]; benefits: Benefit[] };

const benefits: Benefit[] = [
  { id: 'true-price', title: 'TRUST Price Shield', description: 'Track eligible price drops and surface a transparent adjustment policy.', promise: 'price', enabled: true },
  { id: 'delivery-promise', title: 'Delivery Promise', description: 'Show an ETA before checkout and keep customers informed through every milestone.', promise: 'delivery', enabled: true },
  { id: 'trust-proof', title: 'Authenticity & Seller Proof', description: 'Expose seller verification, product provenance and review-quality signals.', promise: 'authenticity', enabled: true },
  { id: 'easy-returns', title: 'One-Tap Returns', description: 'Centralize eligible return, exchange and refund workflows in one place.', promise: 'returns', enabled: true },
  { id: 'human-support', title: 'Human + AI Concierge', description: 'Fast AI assistance with escalation to a human support workflow.', promise: 'support', enabled: true },
  { id: 'loyalty', title: 'TRUST Circle', description: 'Reward repeat customers with transparent points, perks and early access.', promise: 'price', enabled: true },
];

export function getSwitchingExperience(): SwitchingScore {
  return {
    score: 96,
    reasons: [
      'Lower uncertainty before checkout',
      'More transparent seller and product signals',
      'Post-purchase experience is treated as part of the product',
      'Personalized discovery without hiding the underlying price or policy',
    ],
    benefits,
  };
}
