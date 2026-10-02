import type { CircuitState } from './contracts.ts';
export interface CarrierHealth { carrierCode:string; successCount:number; failureCount:number; consecutiveFailures:number; circuitState:CircuitState; }
export function nextCarrierHealth(current:CarrierHealth,event:'SUCCESS'|'FAILURE'):CarrierHealth{
 if(event==='SUCCESS')return {...current,successCount:current.successCount+1,consecutiveFailures:0,circuitState:'CLOSED'};
 const failures=current.consecutiveFailures+1;return {...current,failureCount:current.failureCount+1,consecutiveFailures:failures,circuitState:failures>=5?'OPEN':current.circuitState};
}
export function canRouteThroughHealth(health:CarrierHealth){return health.circuitState!=='OPEN';}
