export type LogisticsPriority='BALANCED'|'COST'|'SPEED'|'RELIABILITY';
export interface CarrierMetric { carrierCode:string; successCount:number; failureCount:number; consecutiveFailures:number; circuitState:'CLOSED'|'OPEN'|'HALF_OPEN'; }
export interface LogisticsCandidate { carrierCode:string; serviceCode:string; costMinor:bigint; minDays:number; maxDays:number; reliability:number; score:number; reasons:string[]; }
export interface LogisticsDecision { country:string; currency:string; mode:string; priority:LogisticsPriority; selectedCarrier:string; selectedService:string; score:number; candidates:LogisticsCandidate[]; decisionIdempotencyKey:string; }
export interface LogisticsWeights { cost:number; speed:number; reliability:number; }
