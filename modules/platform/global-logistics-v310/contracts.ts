export type PromiseRisk='ON_TRACK'|'AT_RISK'|'BREACH';
export type PromiseAction='NO_ACTION'|'MONITOR'|'ACCELERATE'|'REPLAN_CARRIER'|'ESCALATE_PROMISE_BREACH';
export interface PromiseAssessmentInput{shipmentStatus:string;etaAt?:string|null;promisedAt?:string|null;now?:string|null;riskScore?:number;openExceptions?:number;criticalExceptions?:number;recoveryStatus?:string|null;}
export interface PromiseAssessment{promiseRisk:PromiseRisk;minutesToPromise:number|null;minutesToEta:number|null;slackMinutes:number|null;riskScore:number;reasons:string[];recommendedAction:PromiseAction;}
const mins=(a:number,b:number)=>Math.round((b-a)/60000);
export function assessDeliveryPromise(input:PromiseAssessmentInput):PromiseAssessment{
 const now=new Date(input.now??new Date().toISOString()).getTime(), promise=input.promisedAt?new Date(input.promisedAt).getTime():NaN, eta=input.etaAt?new Date(input.etaAt).getTime():NaN;
 if(!Number.isFinite(now)||input.promisedAt&&!Number.isFinite(promise)) throw new Error('INVALID_PROMISE_TIMESTAMP');
 const minutesToPromise=Number.isFinite(promise)?mins(now,promise):null; const minutesToEta=Number.isFinite(eta)?mins(now,eta):null; const slackMinutes=minutesToEta!==null&&minutesToPromise!==null?minutesToPromise-minutesToEta:null;
 if(['DELIVERED','CANCELLED'].includes(input.shipmentStatus)) return {promiseRisk:'ON_TRACK',minutesToPromise:minutesToPromise===null?null:Math.max(0,minutesToPromise),minutesToEta,slackMinutes,riskScore:0,reasons:[],recommendedAction:'NO_ACTION'};
 let score=Math.max(0,Math.min(100,Number(input.riskScore??0))); const reasons:string[]=[];
 if(!Number.isFinite(promise)){score+=30;reasons.push('PROMISE_MISSING');}
 if(!Number.isFinite(eta)){score+=20;reasons.push('ETA_MISSING');}
 if(Number.isFinite(eta)&&Number.isFinite(promise)&&eta>promise){score+=35;reasons.push('ETA_AFTER_PROMISE');}
 if(minutesToPromise!==null&&minutesToPromise<=0){score+=45;reasons.push('PROMISE_WINDOW_EXPIRED');}
 else if(minutesToPromise!==null&&minutesToPromise<=120){score+=35;reasons.push('PROMISE_WINDOW_NEAR');}
 if(Number(input.criticalExceptions??0)>0){score+=20;reasons.push('CRITICAL_EXCEPTION_OPEN');}
 else if(Number(input.openExceptions??0)>0){score+=10;reasons.push('FULFILLMENT_EXCEPTION_OPEN');}
 if(input.recoveryStatus==='FAILED'){score+=15;reasons.push('RECOVERY_FAILED');}
 score=Math.min(100,score);
 let promiseRisk:PromiseRisk=score>=70?'BREACH':score>=35?'AT_RISK':'ON_TRACK';
 if(Number.isFinite(eta)&&Number.isFinite(promise)&&eta>promise) promiseRisk='BREACH';
 let recommendedAction:PromiseAction='MONITOR';
 if(promiseRisk==='BREACH') recommendedAction='ESCALATE_PROMISE_BREACH';
 else if(reasons.includes('ETA_AFTER_PROMISE')||reasons.includes('PROMISE_WINDOW_NEAR')) recommendedAction='REPLAN_CARRIER';
 else if(promiseRisk==='AT_RISK') recommendedAction='ACCELERATE';
 else if(promiseRisk==='ON_TRACK'&&score===0) recommendedAction='NO_ACTION';
 return {promiseRisk,minutesToPromise,minutesToEta,slackMinutes,riskScore:score,reasons,recommendedAction};
}
