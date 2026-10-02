import {createHash} from 'node:crypto';
import type {DeploymentAutopilotResult} from './contracts.ts';
import type {ProductionEvidenceBundle} from '../production-reliability/evidence.ts';
export function createDeploymentEvidence(candidateHash:string,result:DeploymentAutopilotResult,bundle?:ProductionEvidenceBundle){const base={schema:'trust.deployment-autopilot.v1',candidateHash,result,bundleHash:bundle?.bundleHash??null};return {...base,evidenceHash:createHash('sha256').update(JSON.stringify(base)).digest('hex')};}
