export interface SLO {name:string; target:number; windowDays:number}
export const coreSLOs:SLO[]=[
 {name:'api-availability',target:99.95,windowDays:30},
 {name:'checkout-success-path',target:99.90,windowDays:30},
 {name:'webhook-processing',target:99.99,windowDays:30},
 {name:'job-recovery-within-5m',target:99.95,windowDays:30}
];
export function errorBudget(target:number, observed:number){return Math.max(0,observed-target)}
