import {createHash} from 'node:crypto';
import type {VerificationResult} from './contracts.ts';
export function evidenceHash(value:unknown):string{return createHash('sha256').update(JSON.stringify(value,(k,v)=>typeof v==='bigint'?`${v}n`:v)).digest('hex');}
export function aggregateEvidence(results:VerificationResult[]){const critical=results.filter(r=>r.status!=='SKIPPED');const passed=critical.every(r=>r.status==='PASS');return {status:passed?'PASS':'FAIL',total:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,skipped:results.filter(r=>r.status==='SKIPPED').length,criticalEvidenceHash:evidenceHash(critical)};}
