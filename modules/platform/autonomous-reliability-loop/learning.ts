import {createHash} from 'node:crypto';
export interface LearningRecord {failureHash?:string;decision:string;status:string;reasons:string[];occurrence:number;policyRevision:string;}
export interface ReliabilityLearner {record(input:LearningRecord):{learningHash:string;accepted:true};}
export class InMemoryReliabilityLearner implements ReliabilityLearner {
  private counts=new Map<string,number>();
  record(input:LearningRecord){const key=input.failureHash||'NO_FAILURE';const occurrence=(this.counts.get(key)||0)+1;this.counts.set(key,occurrence);const learningHash=createHash('sha256').update(JSON.stringify({...input,occurrence})).digest('hex');return {learningHash,accepted:true as const};}
}
