export type RecoveryPolicy={maxAttempts:number;baseDelayMs:number;maxDelayMs:number};
export function backoff(attempt:number,p:RecoveryPolicy){ if(attempt<1||p.maxAttempts<1) throw new Error('RECOVERY_POLICY_INVALID'); return Math.min(p.maxDelayMs,p.baseDelayMs*2**(attempt-1)); }
export function shouldRetry(attempt:number,p:RecoveryPolicy){return attempt<p.maxAttempts;}
