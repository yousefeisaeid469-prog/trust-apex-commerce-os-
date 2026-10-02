import { rateLimit as memoryRateLimit, type RateLimitResult } from './memory.ts';

export type SharedRateLimitStore = { increment(key:string, limit:number, windowMs:number): Promise<RateLimitResult> };
let store: SharedRateLimitStore | undefined;
export function configureSharedRateLimitStore(next: SharedRateLimitStore){ store=next; }
export async function rateLimitDistributed(key:string, limit=60, windowMs=60_000): Promise<RateLimitResult>{
  if (store) return store.increment(key,limit,windowMs);
  if (process.env.NODE_ENV==='production' && process.env.TRUST_RATE_LIMIT_BACKEND==='shared') throw new Error('SHARED_RATE_LIMIT_STORE_NOT_CONFIGURED');
  return memoryRateLimit(key,limit,windowMs);
}
export function sharedRateLimitConfigured(){ return Boolean(store); }
