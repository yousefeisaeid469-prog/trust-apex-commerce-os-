export type LeaseAttempt={worker:string;token:number;action:string};
export function acceptFencedWrite(currentToken:number,attempt:LeaseAttempt){return attempt.token===currentToken?{accepted:true,reason:'CURRENT_FENCE'}:{accepted:false,reason:'STALE_FENCE'}}
export function simulateLeaseLoss(currentToken:number,attempts:LeaseAttempt[]){return attempts.map(a=>({...a,...acceptFencedWrite(currentToken,a)}))}
