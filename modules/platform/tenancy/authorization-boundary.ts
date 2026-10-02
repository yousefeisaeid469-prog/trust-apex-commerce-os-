import type { TenantContext } from './context';
export type TenantResource = { tenantId: string; resourceType?: string };
export type AuthorizationBoundary = { context: TenantContext; resource: TenantResource };
export function assertSameTenant(boundary: AuthorizationBoundary): void { if (boundary.context.actorType === 'system') return; if (boundary.context.tenantId !== boundary.resource.tenantId) throw new Error('TENANT_BOUNDARY_VIOLATION'); }
export function requireTenantScope(context: TenantContext): string { if (!context.tenantId) throw new Error('TENANT_CONTEXT_REQUIRED'); if (!context.actorId) throw new Error('ACTOR_CONTEXT_REQUIRED'); return context.tenantId; }
