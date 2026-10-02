export type KeyState = 'active' | 'rotating' | 'revoked' | 'expired';
export type KeyMetadata = { id: string; purpose: string; state: KeyState; createdAt: string; activatedAt?: string; revokedAt?: string; expiresAt?: string; replacedBy?: string };
export function canUseKey(key: KeyMetadata, now = Date.now()) { if (key.state !== 'active') return false; return !key.expiresAt || Date.parse(key.expiresAt) > now; }
export function rotateKey(oldKey: KeyMetadata, replacementId: string, now = new Date().toISOString()) { if (oldKey.state === 'revoked') throw new Error('KEY_ALREADY_REVOKED'); return { ...oldKey, state: 'rotating' as const, replacedBy: replacementId, revokedAt: now }; }
