export type VerificationStatus='PASS'|'FAIL'|'SKIPPED';
export type VerificationKind='UNIT'|'INTEGRATION'|'E2E'|'FAILURE_INJECTION'|'REPLAY'|'LOAD'|'SECURITY'|'DR';
export type VerificationCase={id:string;kind:VerificationKind;workflow:string;description:string;critical:boolean;requiresLive:boolean};
export type VerificationResult={caseId:string;status:VerificationStatus;durationMs:number;checks:string[];evidence:string[];error?:string;environment:'sandbox'|'live'};
export type FailurePoint='PAYMENT_PROVIDER'|'CARRIER'|'DATABASE'|'OUTBOX'|'NETWORK'|'WORKER';
export type FailureInjection={point:FailurePoint;mode:'ONCE'|'ALWAYS'|'RATE';rate?:number};
export type ReplayEvent={sequence:number;type:string;payload:Record<string,unknown>;at:string};
export type ReplayResult={eventCount:number;deterministic:boolean;stateHash:string;firstDivergence?:number};
