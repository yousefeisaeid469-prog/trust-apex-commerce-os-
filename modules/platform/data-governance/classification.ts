export type DataClass='PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'RESTRICTED';
export type RetentionRule={dataClass:DataClass;retentionDays:number;legalHoldAllowed:boolean};
const rank:Record<DataClass,number>={PUBLIC:0,INTERNAL:1,CONFIDENTIAL:2,RESTRICTED:3};
export function maxClassification(a:DataClass,b:DataClass):DataClass{return rank[a]>=rank[b]?a:b;}
export function validateRetention(rule:RetentionRule):void{if(!Number.isInteger(rule.retentionDays)||rule.retentionDays<1||rule.retentionDays>36500)throw new Error('INVALID_RETENTION');if(rule.dataClass==='RESTRICTED'&&!rule.legalHoldAllowed)throw new Error('RESTRICTED_DATA_REQUIRES_LEGAL_HOLD_SUPPORT');}
