export type AdapterAction='PRICE'|'SUPPLY'|'FULFILLMENT'|'FINANCE'|'SUPPORT'|'TRUST'|'GENERIC';
export type AdapterRunStatus='EXECUTED'|'RETRYABLE_FAILURE'|'DEAD_LETTERED'|'CIRCUIT_OPEN'|'BLOCKED'|'DUPLICATE';
export interface AdapterCommand { commandId:string; tenantId:string; action:AdapterAction; payload:Record<string,string|number|boolean>; idempotencyKey:string; }
export interface AdapterResult { status:'SUCCESS'|'FAILURE'; providerReference?:string; reason?:string; }
export interface ExecutionAdapter { readonly name:string; readonly actions:AdapterAction[]; execute(command:AdapterCommand):Promise<AdapterResult>; compensate?(command:AdapterCommand):Promise<AdapterResult>; }
export interface AdapterPolicy { maxAttempts:number; baseDelayMs:number; failureThreshold:number; cooldownMs:number; }
export interface AdapterRun { commandId:string; tenantId:string; adapter:string; status:AdapterRunStatus; attempts:number; providerReference?:string; reason:string; }
export interface DeadLetter { commandId:string; tenantId:string; adapter:string; payload:Record<string,string|number|boolean>; reason:string; createdAt:number; }
export interface CircuitState { adapter:string; failures:number; openedAt?:number; }
