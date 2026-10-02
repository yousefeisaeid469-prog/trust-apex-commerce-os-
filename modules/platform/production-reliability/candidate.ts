import {createHash} from 'node:crypto';
export interface ReleaseCandidate {version:string;sourceFingerprint:string;migrationFingerprint:string;policyRevision:string;buildRef:string;createdAt:string;candidateHash:string;}
export function createReleaseCandidate(input:{version:string;sourceFingerprint:string;migrationFingerprint:string;policyRevision:string;buildRef:string;createdAt:string}):ReleaseCandidate{const base={...input};const candidateHash=createHash('sha256').update(JSON.stringify(base)).digest('hex');return {...base,candidateHash};}
