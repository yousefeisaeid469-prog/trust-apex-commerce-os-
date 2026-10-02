import type { NextRequest } from 'next/server';
import type { UserAccount, UserRole } from '../../identity/core/types';
import { getUserBySession } from './store';
import { SESSION_COOKIE } from './http';
import { hasPermission, type Permission } from './rbac';

export async function getCurrentUser(request: NextRequest): Promise<UserAccount | undefined> {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return undefined;
  return getUserBySession(sessionId);
}

export async function requireUser(request: NextRequest): Promise<UserAccount> {
  const user = await getCurrentUser(request);
  if (!user) throw new AuthRequiredError();
  return user;
}

export async function requirePermission(request: NextRequest, permission: Permission): Promise<UserAccount> {
  const user = await requireUser(request);
  if (!hasPermission(user.role, permission)) throw new ForbiddenError();
  return user;
}

export function hasRole(user: UserAccount, ...roles: UserRole[]) { return roles.includes(user.role); }
export class AuthRequiredError extends Error { constructor(){ super('Authentication required'); this.name='AuthRequiredError'; } }
export class ForbiddenError extends Error { constructor(){ super('You do not have permission to perform this action'); this.name='ForbiddenError'; } }
