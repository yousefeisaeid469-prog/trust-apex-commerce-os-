import {createHash} from 'node:crypto';
import type {FailureInjection,FailurePoint} from './contracts.ts';
export class FailureInjector{private rules=new Map<FailurePoint,FailureInjection>();private counts=new Map<FailurePoint,number>();
  set(rule:FailureInjection){if(rule.mode==='RATE'&&(rule.rate===undefined||rule.rate<0||rule.rate>1))throw new Error('INVALID_FAILURE_RATE');this.rules.set(rule.point,rule);this.counts.set(rule.point,0);return this;}
  clear(point?:FailurePoint){if(point)this.rules.delete(point);else this.rules.clear();return this;}
  shouldFail(point:FailurePoint,sequence=1){const r=this.rules.get(point);if(!r)return false;const n=(this.counts.get(point)??0)+1;this.counts.set(point,n);if(r.mode==='ALWAYS')return true;if(r.mode==='ONCE')return n===1;const digest=createHash('sha256').update(`${point}:${sequence}`).digest().readUInt32BE(0)/0xffffffff;return digest<(r.rate??0);}
}
export function injectFailure<T>(injector:FailureInjector,point:FailurePoint,sequence:number,work:()=>T):T{if(injector.shouldFail(point,sequence))throw new Error(`INJECTED_FAILURE:${point}`);return work();}
