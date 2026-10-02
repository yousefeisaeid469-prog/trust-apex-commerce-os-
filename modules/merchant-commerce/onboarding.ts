import * as k from './kernel';
export type MerchantonboardingStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
export type MerchantonboardingRecord = k.MerchantDomainRecord;
export type MerchantonboardingCommand = k.MerchantDomainCommand;
export const MERCHANTONBOARDING_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const;
export const MERCHANTONBOARDING_TERMINAL = new Set<MerchantonboardingStatus>(['SUSPENDED', 'REJECTED']);
export function validateMerchantonboarding(input:Partial<MerchantonboardingRecord>):string[]{return k.validate(input,MERCHANTONBOARDING_STATUSES);}
export function normalizeMerchantonboarding(input:Partial<MerchantonboardingRecord>):MerchantonboardingRecord{return k.normalize(input,MERCHANTONBOARDING_STATUSES) as MerchantonboardingRecord;}
export function canTransitionMerchantonboarding(from:MerchantonboardingStatus,to:MerchantonboardingStatus):boolean{return k.canTransition(from,to,MERCHANTONBOARDING_STATUSES);}
export function transitionMerchantonboarding(record:MerchantonboardingRecord,to:MerchantonboardingStatus,actorId:string):MerchantonboardingRecord{return k.transition(record,to,actorId,MERCHANTONBOARDING_STATUSES) as MerchantonboardingRecord;}
export function summarizeMerchantonboarding(records:MerchantonboardingRecord[]){return k.summarize(records);}
export function isActionableMerchantonboarding(record:MerchantonboardingRecord){return k.rule(record);}
export function isStaleMerchantonboarding(record:MerchantonboardingRecord){return Date.now()-Date.parse(record.updatedAt)>86400000;}
export function needsReviewMerchantonboarding(record:MerchantonboardingRecord){return record.score>=75||record.amount>=10000;}
export function hasFinancialExposureMerchantonboarding(record:MerchantonboardingRecord){return record.amount>0;}
export function hasQuantityExposureMerchantonboarding(record:MerchantonboardingRecord){return record.quantity>0;}
export function isMerchantOwnedMerchantonboarding(record:MerchantonboardingRecord){return Boolean(record.merchantId);}
export function isFreshMerchantonboarding(record:MerchantonboardingRecord){return !Number.isNaN(Date.parse(record.updatedAt))&&Date.now()-Date.parse(record.updatedAt)<=86400000;}
export function isCompleteMerchantonboarding(record:MerchantonboardingRecord){return k.validate(record,MERCHANTONBOARDING_STATUSES).length===0;}
export function isTerminalMerchantonboarding(record:MerchantonboardingRecord){return MERCHANTONBOARDING_TERMINAL.has(record.status);}
export function isHighPriorityMerchantonboarding(record:MerchantonboardingRecord){return record.score>=85||record.amount>=50000;}
export function hasMetadataMerchantonboarding(record:MerchantonboardingRecord){return Object.keys(record.metadata).length>0;}
export function requiresOperatorMerchantonboarding(record:MerchantonboardingRecord){return record.score>=70;}
export function rankMerchantonboarding(records:MerchantonboardingRecord[]):MerchantonboardingRecord[]{return k.rank(records);}
export function filterMerchantonboarding(records:MerchantonboardingRecord[],predicate:(record:MerchantonboardingRecord)=>boolean):MerchantonboardingRecord[]{return k.filter(records,predicate);}
export function byMerchantMerchantonboarding(records:MerchantonboardingRecord[],merchantId:string):MerchantonboardingRecord[]{return k.byMerchant(records,merchantId);}
export function byStatusMerchantonboarding(records:MerchantonboardingRecord[],status:MerchantonboardingStatus):MerchantonboardingRecord[]{return k.byStatus(records,status);}
export function totalAmountMerchantonboarding(records:MerchantonboardingRecord[]):number{return k.totalAmount(records);}
export function totalQuantityMerchantonboarding(records:MerchantonboardingRecord[]):number{return k.totalQuantity(records);}
export function averageScoreMerchantonboarding(records:MerchantonboardingRecord[]):number{return k.averageScore(records);}
export function mergeMetadataMerchantonboarding(record:MerchantonboardingRecord,patch:Record<string,string>):MerchantonboardingRecord{return k.mergeMetadata(record,patch);}
export function redactMerchantonboarding(record:MerchantonboardingRecord){return k.redact(record);}
export function assertMerchantonboardingOwnership(record:MerchantonboardingRecord,merchantId:string):void{return k.assertOwnership(record,merchantId);}
export function nextSuggestedMerchantonboarding(status:MerchantonboardingStatus):MerchantonboardingStatus{const i=MERCHANTONBOARDING_STATUSES.indexOf(status);return i<0?MERCHANTONBOARDING_STATUSES[0]:(MERCHANTONBOARDING_STATUSES[i+1]??status);}
export function policyMerchantonboarding(record:MerchantonboardingRecord){return k.policy(record,MERCHANTONBOARDING_STATUSES);}
export function ruleMerchantonboarding1(record:MerchantonboardingRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantonboarding2(record:MerchantonboardingRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantonboarding3(record:MerchantonboardingRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantonboarding4(record:MerchantonboardingRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantonboarding5(record:MerchantonboardingRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantonboarding6(record:MerchantonboardingRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantonboarding7(record:MerchantonboardingRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantonboarding8(record:MerchantonboardingRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantonboarding9(record:MerchantonboardingRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantonboarding10(record:MerchantonboardingRecord,context:any={}):boolean{return k.rule(record,context);}
export function selectMerchantonboarding1(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding2(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding3(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding4(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding5(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding6(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding7(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding8(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding9(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function selectMerchantonboarding10(...args:any[]):any{return k.evaluate(args[0] as MerchantonboardingRecord,args[1]??{});}
export function evaluateSurfacePolicy1(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy2(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy3(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy4(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy5(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy6(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy7(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy8(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy9(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy10(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy11(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy12(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy13(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy14(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy15(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy16(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy17(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy18(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy19(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy20(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy21(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy22(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy23(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy24(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy25(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy26(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy27(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy28(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy29(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy30(record:MerchantonboardingRecord,context:any={}){return k.evaluate(record,context);}
