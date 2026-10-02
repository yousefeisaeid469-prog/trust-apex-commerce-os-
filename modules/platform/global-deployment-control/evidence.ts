import {createHash} from 'node:crypto';
import type {GlobalDeploymentResult} from './contracts.ts';
export function createGlobalDeploymentEvidence(candidateHash:string,result:Omit<GlobalDeploymentResult,'evidenceHash'>){const base={schema:'trust.global-deployment-control.v1',candidateHash,result};return {...base,evidenceHash:createHash('sha256').update(JSON.stringify(base)).digest('hex')};}
