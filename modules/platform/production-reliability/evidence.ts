import {createHash} from 'node:crypto';
import type {ProductionReliabilityCycleResult} from './contracts.ts';
export interface ProductionEvidenceBundle {schema:'trust.production-reliability.v1';candidateHash:string;cycle:ProductionReliabilityCycleResult;bundleHash:string;}
export function createEvidenceBundle(candidateHash:string,cycle:ProductionReliabilityCycleResult):ProductionEvidenceBundle{const base={schema:'trust.production-reliability.v1' as const,candidateHash,cycle};const bundleHash=createHash('sha256').update(JSON.stringify(base)).digest('hex');return {...base,bundleHash};}
