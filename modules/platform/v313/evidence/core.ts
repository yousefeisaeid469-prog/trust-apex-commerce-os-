import {createHash} from 'node:crypto';
export type Evidence={workflow:string;status:'PASS'|'FAIL';checks:string[];timestamp:string};
export function evidenceHash(e:Evidence):string{return createHash('sha256').update(JSON.stringify(e)).digest('hex');}
export function criticalWorkflowGate(e:Evidence):void{if(e.status!=='PASS'||e.checks.length<3)throw new Error('CRITICAL_WORKFLOW_EVIDENCE_INSUFFICIENT');}
