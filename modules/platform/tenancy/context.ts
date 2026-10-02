export type TenantContext = {
  tenantId: string;
  actorId: string;
  actorType: 'customer' | 'merchant' | 'admin' | 'support' | 'operations' | 'system';
};

export function assertTenantId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{3,80}$/.test(value)) {
    throw new Error('Invalid tenant id');
  }
  return value;
}

export function assertTenantAccess(context: TenantContext, resourceTenantId: string): void {
  if (context.actorType === 'system' || context.actorType === 'admin' || context.actorType === 'operations') return;
  if (context.tenantId !== resourceTenantId) throw new Error('Tenant access denied');
}
