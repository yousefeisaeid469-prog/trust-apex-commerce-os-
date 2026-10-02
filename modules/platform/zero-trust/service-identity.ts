import { createHash } from 'node:crypto';

export type ServiceIdentity = { serviceId:string; tenantId:string; keyId:string; issuedAt:number; expiresAt:number; nonce:string };
export function fingerprintIdentity(identity: ServiceIdentity): string {
  if (!identity.serviceId || !identity.tenantId || !identity.keyId || !identity.nonce) throw new Error('SERVICE_IDENTITY_REQUIRED');
  if (identity.expiresAt <= identity.issuedAt) throw new Error('SERVICE_IDENTITY_WINDOW_INVALID');
  return createHash('sha256').update(JSON.stringify(identity, Object.keys(identity).sort())).digest('hex');
}
export function assertIdentityFresh(identity: ServiceIdentity, now:number, maxSkewMs=30000): void {
  if (now < identity.issuedAt-maxSkewMs || now > identity.expiresAt+maxSkewMs) throw new Error('SERVICE_IDENTITY_EXPIRED');
}
