import * as k from './kernel';
export type MerchantpayoutsStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'HELD' | 'REVERSED';
export type MerchantpayoutsRecord = k.MerchantDomainRecord;
export type MerchantpayoutsCommand = k.MerchantDomainCommand;
export const MERCHANTPAYOUTS_STATUSES = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'HELD', 'REVERSED'] as const;
export const MERCHANTPAYOUTS_TERMINAL = new Set<MerchantpayoutsStatus>(['FAILED']);
export function validateMerchantpayouts(input:Partial<MerchantpayoutsRecord>):string[]{return k.validate(input,MERCHANTPAYOUTS_STATUSES);}
export function normalizeMerchantpayouts(input:Partial<MerchantpayoutsRecord>):MerchantpayoutsRecord{return k.normalize(input,MERCHANTPAYOUTS_STATUSES) as MerchantpayoutsRecord;}
export function canTransitionMerchantpayouts(from:MerchantpayoutsStatus,to:MerchantpayoutsStatus):boolean{return k.canTransition(from,to,MERCHANTPAYOUTS_STATUSES);}
export function transitionMerchantpayouts(record:MerchantpayoutsRecord,to:MerchantpayoutsStatus,actorId:string):MerchantpayoutsRecord{return k.transition(record,to,actorId,MERCHANTPAYOUTS_STATUSES) as MerchantpayoutsRecord;}
export function summarizeMerchantpayouts(records:MerchantpayoutsRecord[]){return k.summarize(records);}
export function isActionableMerchantpayouts(record:MerchantpayoutsRecord){return k.rule(record);}
export function isStaleMerchantpayouts(record:MerchantpayoutsRecord){return Date.now()-Date.parse(record.updatedAt)>86400000;}
export function needsReviewMerchantpayouts(record:MerchantpayoutsRecord){return record.score>=75||record.amount>=10000;}
export function hasFinancialExposureMerchantpayouts(record:MerchantpayoutsRecord){return record.amount>0;}
export function hasQuantityExposureMerchantpayouts(record:MerchantpayoutsRecord){return record.quantity>0;}
export function isMerchantOwnedMerchantpayouts(record:MerchantpayoutsRecord){return Boolean(record.merchantId);}
export function isFreshMerchantpayouts(record:MerchantpayoutsRecord){return !Number.isNaN(Date.parse(record.updatedAt))&&Date.now()-Date.parse(record.updatedAt)<=86400000;}
export function isCompleteMerchantpayouts(record:MerchantpayoutsRecord){return k.validate(record,MERCHANTPAYOUTS_STATUSES).length===0;}
export function isTerminalMerchantpayouts(record:MerchantpayoutsRecord){return MERCHANTPAYOUTS_TERMINAL.has(record.status);}
export function isHighPriorityMerchantpayouts(record:MerchantpayoutsRecord){return record.score>=85||record.amount>=50000;}
export function hasMetadataMerchantpayouts(record:MerchantpayoutsRecord){return Object.keys(record.metadata).length>0;}
export function requiresOperatorMerchantpayouts(record:MerchantpayoutsRecord){return record.score>=70;}
export function rankMerchantpayouts(records:MerchantpayoutsRecord[]):MerchantpayoutsRecord[]{return k.rank(records);}
export function filterMerchantpayouts(records:MerchantpayoutsRecord[],predicate:(record:MerchantpayoutsRecord)=>boolean):MerchantpayoutsRecord[]{return k.filter(records,predicate);}
export function byMerchantMerchantpayouts(records:MerchantpayoutsRecord[],merchantId:string):MerchantpayoutsRecord[]{return k.byMerchant(records,merchantId);}
export function byStatusMerchantpayouts(records:MerchantpayoutsRecord[],status:MerchantpayoutsStatus):MerchantpayoutsRecord[]{return k.byStatus(records,status);}
export function totalAmountMerchantpayouts(records:MerchantpayoutsRecord[]):number{return k.totalAmount(records);}
export function totalQuantityMerchantpayouts(records:MerchantpayoutsRecord[]):number{return k.totalQuantity(records);}
export function averageScoreMerchantpayouts(records:MerchantpayoutsRecord[]):number{return k.averageScore(records);}
export function mergeMetadataMerchantpayouts(record:MerchantpayoutsRecord,patch:Record<string,string>):MerchantpayoutsRecord{return k.mergeMetadata(record,patch);}
export function redactMerchantpayouts(record:MerchantpayoutsRecord){return k.redact(record);}
export function assertMerchantpayoutsOwnership(record:MerchantpayoutsRecord,merchantId:string):void{return k.assertOwnership(record,merchantId);}
export function nextSuggestedMerchantpayouts(status:MerchantpayoutsStatus):MerchantpayoutsStatus{const i=MERCHANTPAYOUTS_STATUSES.indexOf(status);return i<0?MERCHANTPAYOUTS_STATUSES[0]:(MERCHANTPAYOUTS_STATUSES[i+1]??status);}
export function policyMerchantpayouts(record:MerchantpayoutsRecord){return k.policy(record,MERCHANTPAYOUTS_STATUSES);}
export function ruleMerchantpayouts1(record:MerchantpayoutsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantpayouts2(record:MerchantpayoutsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantpayouts3(record:MerchantpayoutsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantpayouts4(record:MerchantpayoutsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantpayouts5(record:MerchantpayoutsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantpayouts6(record:MerchantpayoutsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantpayouts7(record:MerchantpayoutsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantpayouts8(record:MerchantpayoutsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantpayouts9(record:MerchantpayoutsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantpayouts10(record:MerchantpayoutsRecord,context:any={}):boolean{return k.rule(record,context);}
export function selectMerchantpayouts1(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts2(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts3(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts4(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts5(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts6(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts7(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts8(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts9(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function selectMerchantpayouts10(...args:any[]):any{return k.evaluate(args[0] as MerchantpayoutsRecord,args[1]??{});}
export function evaluateSurfacePolicy1(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy2(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy3(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy4(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy5(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy6(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy7(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy8(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy9(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy10(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy11(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy12(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy13(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy14(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy15(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy16(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy17(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy18(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy19(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy20(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy21(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy22(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy23(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy24(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy25(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy26(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy27(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy28(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy29(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy30(record:MerchantpayoutsRecord,context:any={}){return k.evaluate(record,context);}
