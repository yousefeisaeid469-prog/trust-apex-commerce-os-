export type LabStatus='PASS'|'FAIL'|'SKIPPED';
export type CheckKind='MIGRATION'|'TRANSACTION'|'CONCURRENCY'|'FAILURE_INJECTION'|'REPLAY'|'INVARIANT'|'LOAD';
export interface LabCheck { name:string; kind:CheckKind; status:LabStatus; durationMs:number; details:Record<string,unknown>; }
export interface LabReport { version:'V318.0.0'; status:LabStatus; startedAt:string; completedAt:string; checks:LabCheck[]; liveDatabase:boolean; externalProvidersLive:boolean; }
export interface InventoryRow { sku:string; available:number; reserved:number; }
export interface OrderRow { id:string; status:'PENDING'|'PAID'|'FULFILLED'|'FAILED'; quantity:number; totalMinor:bigint; }
export interface IntegrationState { inventory:Map<string,InventoryRow>; orders:Map<string,OrderRow>; processedKeys:Set<string>; ledger:bigint; }
