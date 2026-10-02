import * as k from './kernel';
export type MerchantvendorsStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
export type MerchantvendorsRecord = k.MerchantDomainRecord;
export type MerchantvendorsCommand = k.MerchantDomainCommand;
export const MERCHANTVENDORS_STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const;
export const MERCHANTVENDORS_TERMINAL = new Set<MerchantvendorsStatus>(['CANCELLED']);
export function validateMerchantvendors(input:Partial<MerchantvendorsRecord>):string[]{return k.validate(input,MERCHANTVENDORS_STATUSES);}
export function normalizeMerchantvendors(input:Partial<MerchantvendorsRecord>):MerchantvendorsRecord{return k.normalize(input,MERCHANTVENDORS_STATUSES) as MerchantvendorsRecord;}
export function canTransitionMerchantvendors(from:MerchantvendorsStatus,to:MerchantvendorsStatus):boolean{return k.canTransition(from,to,MERCHANTVENDORS_STATUSES);}
export function transitionMerchantvendors(record:MerchantvendorsRecord,to:MerchantvendorsStatus,actorId:string):MerchantvendorsRecord{return k.transition(record,to,actorId,MERCHANTVENDORS_STATUSES) as MerchantvendorsRecord;}
export function summarizeMerchantvendors(records:MerchantvendorsRecord[]){return k.summarize(records);}
export function isActionableMerchantvendors(record:MerchantvendorsRecord){return k.rule(record);}
export function isStaleMerchantvendors(record:MerchantvendorsRecord){return Date.now()-Date.parse(record.updatedAt)>86400000;}
export function needsReviewMerchantvendors(record:MerchantvendorsRecord){return record.score>=75||record.amount>=10000;}
export function hasFinancialExposureMerchantvendors(record:MerchantvendorsRecord){return record.amount>0;}
export function hasQuantityExposureMerchantvendors(record:MerchantvendorsRecord){return record.quantity>0;}
export function isMerchantOwnedMerchantvendors(record:MerchantvendorsRecord){return Boolean(record.merchantId);}
export function isFreshMerchantvendors(record:MerchantvendorsRecord){return !Number.isNaN(Date.parse(record.updatedAt))&&Date.now()-Date.parse(record.updatedAt)<=86400000;}
export function isCompleteMerchantvendors(record:MerchantvendorsRecord){return k.validate(record,MERCHANTVENDORS_STATUSES).length===0;}
export function isTerminalMerchantvendors(record:MerchantvendorsRecord){return MERCHANTVENDORS_TERMINAL.has(record.status);}
export function isHighPriorityMerchantvendors(record:MerchantvendorsRecord){return record.score>=85||record.amount>=50000;}
export function hasMetadataMerchantvendors(record:MerchantvendorsRecord){return Object.keys(record.metadata).length>0;}
export function requiresOperatorMerchantvendors(record:MerchantvendorsRecord){return record.score>=70;}
export function rankMerchantvendors(records:MerchantvendorsRecord[]):MerchantvendorsRecord[]{return k.rank(records);}
export function filterMerchantvendors(records:MerchantvendorsRecord[],predicate:(record:MerchantvendorsRecord)=>boolean):MerchantvendorsRecord[]{return k.filter(records,predicate);}
export function byMerchantMerchantvendors(records:MerchantvendorsRecord[],merchantId:string):MerchantvendorsRecord[]{return k.byMerchant(records,merchantId);}
export function byStatusMerchantvendors(records:MerchantvendorsRecord[],status:MerchantvendorsStatus):MerchantvendorsRecord[]{return k.byStatus(records,status);}
export function totalAmountMerchantvendors(records:MerchantvendorsRecord[]):number{return k.totalAmount(records);}
export function totalQuantityMerchantvendors(records:MerchantvendorsRecord[]):number{return k.totalQuantity(records);}
export function averageScoreMerchantvendors(records:MerchantvendorsRecord[]):number{return k.averageScore(records);}
export function mergeMetadataMerchantvendors(record:MerchantvendorsRecord,patch:Record<string,string>):MerchantvendorsRecord{return k.mergeMetadata(record,patch);}
export function redactMerchantvendors(record:MerchantvendorsRecord){return k.redact(record);}
export function assertMerchantvendorsOwnership(record:MerchantvendorsRecord,merchantId:string):void{return k.assertOwnership(record,merchantId);}
export function nextSuggestedMerchantvendors(status:MerchantvendorsStatus):MerchantvendorsStatus{const i=MERCHANTVENDORS_STATUSES.indexOf(status);return i<0?MERCHANTVENDORS_STATUSES[0]:(MERCHANTVENDORS_STATUSES[i+1]??status);}
export function policyMerchantvendors(record:MerchantvendorsRecord){return k.policy(record,MERCHANTVENDORS_STATUSES);}
export function ruleMerchantvendors1(record:MerchantvendorsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantvendors2(record:MerchantvendorsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantvendors3(record:MerchantvendorsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantvendors4(record:MerchantvendorsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantvendors5(record:MerchantvendorsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantvendors6(record:MerchantvendorsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantvendors7(record:MerchantvendorsRecord,context:any={}):boolean{return k.rule(record,context);}
export function ruleMerchantvendors8(record:MerchantvendorsRecord,context:any={}):boolean{return k.ruleQuantity(record,context);}
export function ruleMerchantvendors9(record:MerchantvendorsRecord,context:any={}):boolean{return k.ruleMerchant(record,context);}
export function ruleMerchantvendors10(record:MerchantvendorsRecord,context:any={}):boolean{return k.rule(record,context);}
export function selectMerchantvendors1(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors2(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors3(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors4(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors5(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors6(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors7(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors8(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors9(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function selectMerchantvendors10(...args:any[]):any{return k.evaluate(args[0] as MerchantvendorsRecord,args[1]??{});}
export function evaluateSurfacePolicy1(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy2(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy3(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy4(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy5(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy6(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy7(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy8(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy9(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy10(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy11(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy12(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy13(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy14(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy15(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy16(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy17(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy18(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy19(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy20(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy21(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy22(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy23(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy24(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy25(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy26(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy27(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy28(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy29(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
export function evaluateSurfacePolicy30(record:MerchantvendorsRecord,context:any={}){return k.evaluate(record,context);}
