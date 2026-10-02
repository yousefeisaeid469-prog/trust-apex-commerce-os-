import {createHash} from 'node:crypto';
export type EvidenceReceipt={version:string;workflow:string;status:'PASS'|'FAIL';checks:string[];inputsHash:string;timestamp:string};
export function hashInput(input:unknown):string{return createHash('sha256').update(JSON.stringify(input,(k,v)=>typeof v==='bigint'?`${v}n`:v)).digest('hex');}
export function receipt(input:Omit<EvidenceReceipt,'inputsHash'> & {inputs:unknown}):EvidenceReceipt{const {inputs,...rest}=input;return {...rest,inputsHash:hashInput(inputs)};}
export function verifyReceipt(r:EvidenceReceipt):boolean{return r.version==='V314.0.0'&&r.status==='PASS'&&r.checks.length>=8&&/^[a-f0-9]{64}$/.test(r.inputsHash);}
