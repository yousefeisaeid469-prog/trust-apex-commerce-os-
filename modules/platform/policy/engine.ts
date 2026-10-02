export type PolicyEffect = 'allow' | 'deny';
export type PolicySubject = { actorId: string; tenantId: string; roles: string[]; attributes?: Record<string, string | number | boolean> };
export type PolicyResource = { tenantId: string; type: string; ownerId?: string; attributes?: Record<string, string | number | boolean> };
export type PolicyRequest = { action: string; subject: PolicySubject; resource: PolicyResource };
export type PolicyRule = { id: string; effect: PolicyEffect; actions: string[]; roles?: string[]; resourceTypes?: string[]; sameTenant?: boolean };

export function evaluatePolicy(request: PolicyRequest, rules: readonly PolicyRule[]) {
  const matches = rules.filter(rule => rule.actions.includes('*') || rule.actions.includes(request.action));
  for (const rule of matches) {
    if (rule.roles?.length && !rule.roles.some(role => request.subject.roles.includes(role))) continue;
    if (rule.resourceTypes?.length && !rule.resourceTypes.includes(request.resource.type)) continue;
    if (rule.sameTenant && request.subject.tenantId !== request.resource.tenantId) continue;
    if (rule.effect === 'deny') return { effect: 'deny' as const, ruleId: rule.id };
    return { effect: 'allow' as const, ruleId: rule.id };
  }
  return { effect: 'deny' as const, ruleId: 'default-deny' };
}

export function assertPolicy(request: PolicyRequest, rules: readonly PolicyRule[]) {
  const result = evaluatePolicy(request, rules);
  if (result.effect !== 'allow') throw new Error(`POLICY_DENIED:${result.ruleId}`);
  return result;
}
