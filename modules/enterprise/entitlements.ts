export type Plan = 'starter'|'growth'|'scale'|'enterprise';
export type Capability = 'checkout'|'payments'|'analytics'|'ai_agents'|'marketplace'|'global_commerce'|'advanced_audit';
const matrix: Record<Plan, ReadonlySet<Capability>> = {
  starter:new Set(['checkout']),
  growth:new Set(['checkout','payments','analytics']),
  scale:new Set(['checkout','payments','analytics','ai_agents','marketplace']),
  enterprise:new Set(['checkout','payments','analytics','ai_agents','marketplace','global_commerce','advanced_audit'])
};
export function canUse(plan:Plan, capability:Capability){return matrix[plan].has(capability)}
export function assertEntitled(plan:Plan, capability:Capability){if(!canUse(plan,capability)) throw new Error(`ENTITLEMENT_DENIED:${plan}:${capability}`)}
