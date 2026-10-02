import type { UserRole } from '../../identity/core/types';

const permissions = {
  customer: ['catalog:read', 'cart:write', 'orders:read:self', 'wishlist:write', 'checkout:write'],
  merchant: ['catalog:read', 'products:write:self', 'inventory:write:self', 'orders:read:self', 'analytics:read:self'],
  admin: ['*'],
  support: ['catalog:read', 'orders:read', 'orders:support', 'customers:support'],
  operations: ['catalog:read', 'inventory:read', 'inventory:write', 'orders:read', 'orders:operate', 'platform:operate'],
} as const;

export type Permission = string;
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const granted = permissions[role] as readonly string[];
  return granted.includes('*') || granted.includes(permission);
}
