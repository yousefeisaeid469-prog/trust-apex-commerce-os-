export type AbuseDecision='allow'|'challenge'|'deny';
export interface AbuseSignal {ip:string; accountId?:string; velocity:number; duplicateRate:number; authFailures:number}
export function classifyAbuse(s:AbuseSignal):AbuseDecision{
 if(!s.ip || s.velocity<0 || s.duplicateRate<0 || s.authFailures<0) throw new Error('ABUSE_SIGNAL_INVALID');
 if(s.authFailures>=10 || s.duplicateRate>=0.8) return 'deny';
 if(s.velocity>=60 || s.authFailures>=5 || s.duplicateRate>=0.5) return 'challenge';
 return 'allow';
}
