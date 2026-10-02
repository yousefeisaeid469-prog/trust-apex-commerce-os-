import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {LabResult} from './engine.ts';
export type EvidenceReceipt={schema:'trust.reliability.receipt.v1';createdAt:string;result:LabResult;replayFingerprint:string;receiptHash:string};
export async function persistEvidence(dir:string,result:LabResult,replayFingerprint:string){await mkdir(dir,{recursive:true});const body={schema:'trust.reliability.receipt.v1',createdAt:new Date().toISOString(),result,replayFingerprint};const {createHash}=await import('node:crypto');const receipt={...body,receiptHash:createHash('sha256').update(JSON.stringify(body)).digest('hex')};const path=join(dir,`${receipt.receiptHash}.json`);await writeFile(path,JSON.stringify(receipt,null,2));return path}
export async function readEvidence(path:string):Promise<EvidenceReceipt>{return JSON.parse(await readFile(path,'utf8'))}
