import type { SessionRecord, UserAccount } from '../../identity/core/types';

export interface SessionStore {
  get(sessionId: string): Promise<SessionRecord | undefined>;
  revoke(sessionId: string): Promise<void>;
}

export interface IdentityProvider {
  getUserBySession(sessionId: string): Promise<UserAccount | undefined>;
}

export async function requireSession(provider: IdentityProvider, sessionId: string | null) {
  if (!sessionId) return undefined;
  return provider.getUserBySession(sessionId);
}
