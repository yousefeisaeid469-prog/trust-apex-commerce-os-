import {createHash} from 'node:crypto';
import type {ProgressiveDeliveryResult} from './contracts.ts';
export function createProgressiveEvidence(candidateHash:string,result:ProgressiveDeliveryResult){const base={schema:'trust.progressive-delivery.v1',candidateHash,result};return {...base,evidenceHash:createHash('sha256').update(JSON.stringify(base)).digest('hex')};}
