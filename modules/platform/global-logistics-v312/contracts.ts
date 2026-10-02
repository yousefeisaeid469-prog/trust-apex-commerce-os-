export const GLOBAL_LOGISTICS_LEARNING_VERSION='V312.0.0';
export type LearnedOutcome='DELIVERED'|'EXCEPTION'|'CANCELLED';
export interface LearningObservation { shipmentId:string; carrierCode:string; serviceCode:string; outcome:LearnedOutcome; promiseHit?:boolean|null; transitDays?:number|null; plannedMaxDays?:number|null; costMinor?:bigint|null; occurredAt:string; }
export interface LearnedCarrierProfile { carrierCode:string; serviceCode:string; sampleCount:number; deliveredCount:number; exceptionCount:number; cancelledCount:number; deliveryRate:number; promiseHitRate:number; exceptionRate:number; avgTransitDays:number|null; confidence:number; adaptiveReliability:number; modelVersion:string; lastObservedAt:string|null; }
export interface LearningRun { modelVersion:string; sampleCount:number; profileCount:number; profiles:LearnedCarrierProfile[]; status:'COMPLETED'|'NO_DATA'; }
