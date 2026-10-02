export type TelemetryKind = 'REQUEST'|'JOB'|'EVENT'|'DB'|'PROVIDER'|'SECURITY';
export type MetricName = 'REQUESTS'|'ERROR_RATE'|'P50_MS'|'P95_MS'|'P99_MS'|'THROUGHPUT_RPS';
export type SLO = { id:string; target:number; windowMinutes:number; metric:'AVAILABILITY'|'ERROR_RATE'|'LATENCY_P95' };
export type MetricSample = { name:MetricName; value:number; count?:number; asOf:string };
export type TelemetryEvent = { id:string; kind:TelemetryKind; name:string; timestamp:string; durationMs?:number; success?:boolean; region?:string; route?:string; attributes?:Record<string,string|number|boolean> };
export type RegionHealth = { region:string; status:'HEALTHY'|'DEGRADED'|'OUTAGE'|'UNKNOWN'; latencyP95Ms:number; errorRate:number; capacityPct:number; checkedAt:string };
export type Incident = { id:string; severity:'SEV1'|'SEV2'|'SEV3'|'SEV4'; status:'OPEN'|'MITIGATING'|'RESOLVED'; title:string; region?:string; startedAt:string; resolvedAt?:string };
export type ObservabilityReport = { version:'V223.0.0'; generatedAt:string; traceId:string; metrics:MetricSample[]; sloResults:{id:string;status:'PASS'|'WARN'|'FAIL';observed:number;target:number;budgetRemaining:number}[]; regions:RegionHealth[]; incidents:Incident[]; blockers:string[]; warnings:string[]; ready:boolean; score:number };
