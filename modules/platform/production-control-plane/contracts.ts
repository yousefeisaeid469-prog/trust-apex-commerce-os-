export type ControlPlanePhase = 'PREFLIGHT'|'DEPLOYING'|'SHIFTING_TRAFFIC'|'VERIFYING'|'PROMOTING'|'ROLLING_BACK'|'RECOVERY_VERIFY'|'COMPLETE'|'FAILED'|'ESCALATED';
export type ControlPlaneDecision = 'PROMOTE'|'ROLLBACK'|'ESCALATE';
export interface DeploymentIntent { deploymentId:string; owner:string; idempotencyKey:string; target:{namespace:string;workload:string;container:string;image:string;replicas:number}; traffic:{service:string;weightPct:number}; }
export interface DeploymentRecord { deploymentId:string; phase:ControlPlanePhase; decision:ControlPlaneDecision|null; revision:string|null; runtimeVerified:boolean; error:string|null; evidenceHash:string|null; updatedAt:string; }
export interface ControlPlaneStore { begin(intent:DeploymentIntent):Promise<{kind:'ACQUIRED'|'CACHED'|'BUSY';record?:DeploymentRecord}>; transition(id:string,phase:ControlPlanePhase,patch?:Partial<DeploymentRecord>):Promise<void>; complete(id:string,record:DeploymentRecord,ttlMs:number):Promise<void>; release(id:string,owner:string):Promise<void>; }
export interface TelemetrySignal { service:string; region?:string; timestampMs:number; availability:number; errorRate:number; p95Ms:number; saturationPct:number; healthy:boolean; attributes?:Record<string,string>; }
export interface TelemetrySource { observe(service:string):Promise<TelemetrySignal>; }
export interface TelemetrySink { emit(signal:TelemetrySignal):Promise<void>; }
export interface ReliabilityPolicy { minAvailability:number; maxErrorRate:number; maxP95Ms:number; maxSaturationPct:number; requireHealthy:boolean; }
export interface ProductionControlPlaneResult extends DeploymentRecord { }
