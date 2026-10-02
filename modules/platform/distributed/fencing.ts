export type Lease = { resource:string; owner:string; token:number; expiresAt:number };

export function acquireLease(current: Lease | undefined, resource:string, owner:string, now=Date.now(), ttlMs=30_000): Lease {
  if (ttlMs < 1000) throw new Error('LEASE_TTL_TOO_SHORT');
  if (current && current.expiresAt > now && current.owner !== owner) throw new Error('LEASE_HELD');
  return { resource, owner, token: (current?.token ?? 0) + 1, expiresAt: now + ttlMs };
}

export function assertFence(lease: Lease, presentedToken:number, now=Date.now()): void {
  if (lease.expiresAt <= now) throw new Error('LEASE_EXPIRED');
  if (presentedToken !== lease.token) throw new Error('STALE_FENCE_TOKEN');
}

export function renewLease(lease: Lease, owner:string, now=Date.now(), ttlMs=30_000): Lease {
  if (lease.owner !== owner) throw new Error('LEASE_OWNER_MISMATCH');
  assertFence(lease, lease.token, now);
  return { ...lease, expiresAt: now + ttlMs };
}
