import * as k from './kernel';
export type MerchantpromotionsStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
export type MerchantpromotionsRecord = k.MerchantDomainRecord;
export type MerchantpromotionsCommand = k.MerchantDomainCommand;
export const MERCHANTPROMOTIONS_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED'] as const;
export const MERCHANTPROMOTIONS_TERMINAL = new Set<MerchantpromotionsStatus>(['EXPIRED']);
export function validateMerchantpromotions(input:Partial<MerchantpromotionsRecord>):string[]{return k.validate(input,MERCHANTPROMOTIONS_STATUSES);}
export function normalizeMerchantpromotions(input:Partial<MerchantpromotionsRecord>):MerchantpromotionsRecord{return k.normalize(input,MERCHANTPROMOTIONS_STATUSES) as MerchantpromotionsRecord;}
export function canTransitionMerchantpromotions(from:MerchantpromotionsStatus,to:MerchantpromotionsStatus):boolean{return k.canTransition(from,to,MERCHANTPROMOTIONS_STATUSES);}
export function transitionMerchantpromotions(record:MerchantpromotionsRecord,to:MerchantpromotionsStatus,actorId:string):MerchantpromotionsRecord{return k.transition(record,to,actorId,MERCHANTPROMOTIONS_STATUSES) as MerchantpromotionsRecord;}
export function summarizeMerchantpromotions(records:MerchantpromotionsRecord[]){return k.summarize(records);}
export function isActionableMerchantpromotions(record:MerchantpromotionsRecord){return k.rule(record);}
export function isStaleMerchantpromotions(record:MerchantpromotionsRecord){return Date.now()-Date.parse(record.updatedAt)>86400000;}
export function needsReviewMerchantpromotions(record:MerchantpromotionsRecord){return record.score>=75||record.amount>=10000;}
export function hasFinancialExposureMerchantpromotions(record:MerchantpromotionsRecord){return record.amount>0;}
export function hasQuantityExposureMerchantpromotions(record:MerchantpromotionsRecord){return record.quantity>0;}
export function isMerchantOwnedMerchantpromotions(record:MerchantpromotionsRecord){return Boolean(record.merchantId);}
export function isFreshMerchantpromotions(record:MerchantpromotionsRecord){return !Number.isNaN(Date.parse(record.updatedAt))&&Date.now()-Date.parse(record.updatedAt)<=86400000;}
export function isCompleteMerchantpromotions(record:MerchantpromotionsRecord){return k.validate(record,MERCHANTPROMOTIONS_STATUSES).length===0;}
export function isTerminalMerchantpromotions(record:MerchantpromotionsRecord){return MERCHANTPROMOTIONS_TERMINAL.has(record.status);}
export function isHighPriorityMerchantpromotions(record:MerchantpromotionsRecord){return record.score>=85||record.amount>=50000;}
export function hasMetadataMerchantpromotions(record:MerchantpromotionsRecord){return Object.keys(record.metadata).length>0;}
export function requiresOperatorMerchantpromotions(record:MerchantpromotionsRecord){return record.score>=70;}
export function rankMerchantpromotions(records:MerchantpromotionsRecord[]):MerchantpromotionsRecord[]{return k.rank(records);}
export function filterMerchantpromotions(records:MerchantpromotionsRecord[],predicate:(record:MerchantpromotionsRecord)=>boolean):MerchantpromotionsRecord[]{return k.filter(records,predicate);}
export function byMerchantMerchantpromotions(records:MerchantpromotionsRecord[],merchantId:string):MerchantpromotionsRecord[]{return k.byMerchant(records,merchantId);}
export function byStatusMerchantpromotions(records:MerchantpromotionsRecord[],status:MerchantpromotionsStatus):MerchantpromotionsRecord[]{return k.byStatus(records,status);}
export function totalAmountMerchantpromotions(records:MerchantpromotionsRecord[]):number{return k.totalAmount(records);}
export function totalQuantityMerchantpromotions(records:MerchantpromotionsRecord[]):number{return k.totalQuantity(records);}
export function averageScoreMerchantpromotions(records:MerchantpromotionsRecord[]):number{return k.averageScore(records);}
export function mergeMetadataMerchantpromotions(record:MerchantpromotionsRecord,patch:Record<string,string>):MerchantpromotionsRecord{return k.mergeMetadata(record,patch);}
export function redactMerchantpromotions(record:MerchantpromotionsRecord){return k.redact(record);}
export function assertMerchantpromotionsOwnership(record:MerchantpromotionsRecord,merchantId:string):void{return k.assertOwnership(record,merchantId);}
export function nextSuggestedMerchantpromotions(status:MerchantpromotionsStatus):MerchantpromotionsStatus{const i=MERCHANTPROMOTIONS_STATUSES.indexOf(status);return i<0?MERCHANTPROMOTIONS_STATUSES[0]:(MERCHANTPROMOTIONS_STATUSES[i+1]??status);}
export function policyMerchantpromotions(record:MerchantpromotionsRecord){return k.policy(record,MERCHANTPROMOTIONS_STATUSES);}
export function ruleMerchantpromotions1(record:MerchantpromotionsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantpromotions2(record:MerchantpromotionsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantpromotions3(record:MerchantpromotionsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantpromotions4(record:MerchantpromotionsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantpromotions5(record:MerchantpromotionsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantpromotions6(record:MerchantpromotionsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantpromotions7(record:MerchantpromotionsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantpromotions8(record:MerchantpromotionsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantpromotions9(record:MerchantpromotionsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantpromotions10(record:MerchantpromotionsRecord,context:any={}):boolean{return k.rule(record,context);}
export function selectMerchantpromotions1(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions2(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions3(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions4(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions5(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions6(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions7(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions8(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions9(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function selectMerchantpromotions10(...args:any[]):any{return k.evaluate(args[0] as MerchantpromotionsRecord,args[1]??{});}
export function evaluateSurfacePolicy1(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy2(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy3(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy4(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy5(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy6(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy7(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy8(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy9(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy10(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy11(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy12(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy13(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy14(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy15(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy16(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy17(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy18(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy19(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy20(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy21(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy22(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy23(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy24(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy25(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy26(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy27(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy28(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy29(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy30(record:MerchantpromotionsRecord,context:any={}){return k.evaluate(record,context);}
