import {createHash} from 'node:crypto';
import type {LabResult} from '../reliability-lab/engine.ts';
export type FailureRecord={failureHash:string;fingerprint:string;seed:number;failure:string|null;firstSeenAt:string;replayMatches:boolean};
export function failureHash(result:LabResult){return createHash('sha256').update(JSON.stringify({operations:result.operations,faults:result.faults,failure:result.failure,invariant:result.invariant})).digest('hex')}
export function classifyFailure(result:LabResult,replayFingerprint:string):FailureRecord{return {failureHash:failureHash(result),fingerprint:result.fingerprint,seed:result.seed,failure:result.failure??null,firstSeenAt:new Date().toISOString(),replayMatches:result.fingerprint===replayFingerprint}}
export function isKnownFailure(hash:string,knownHashes:Set<string>){return knownHashes.has(hash)}
