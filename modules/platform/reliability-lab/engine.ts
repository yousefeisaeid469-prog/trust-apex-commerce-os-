import { createHash } from 'node:crypto';

export type Operation = { id: string; kind: 'OPEN'|'PROCESS'|'CLOSE'|'WEBHOOK'|'LEASE_WRITE'; payload?: string };
export type Fault = { at: number; kind: 'DROP'|'DUPLICATE'|'REORDER'|'THROW'; operationId: string };
export type Step = { index:number; operation:Operation; stateBefore:string; stateAfter:string; injectedFault?:Fault; ok:boolean; error?:string };
export type LabResult = { status:'PASS'|'FAIL'; seed:number; operations:Operation[]; faults:Fault[]; steps:Step[]; invariant:string|null; failure?:string; latencyMs:number[]; slo:{errorRate:number;p95Ms:number;availability:number;budgetConsumedPct:number}; fingerprint:string };

function digest(x:unknown){return createHash('sha256').update(JSON.stringify(x)).digest('hex')}
function rand(seed:number){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}}
export function generateCase(seed:number,length=20):Operation[]{if(length<1||length>200)throw new Error('LAB_CASE_LIMIT');const r=rand(seed);const kinds:Operation['kind'][]=['OPEN','PROCESS','CLOSE','WEBHOOK','LEASE_WRITE'];return Array.from({length},(_,i)=>({id:`op-${i+1}`,kind:kinds[r()%kinds.length],payload:`p-${r()}`}))}
export function generateFaults(seed:number,ops:Operation[],rate=0.15):Fault[]{const r=rand(seed^0x9e3779b9);const out:Fault[]=[];for(let i=0;i<ops.length;i++){if((r()%1000)<rate*1000){const k=['DROP','DUPLICATE','REORDER','THROW'] as const;out.push({at:i,kind:k[r()%k.length],operationId:ops[i].id})}}return out}

function transition(state:string,op:Operation){if(op.kind==='OPEN' && state==='NEW')return 'OPEN';if(op.kind==='PROCESS' && state==='OPEN')return 'PROCESSED';if(op.kind==='CLOSE' && (state==='PROCESSED'||state==='OPEN'))return 'CLOSED';if(op.kind==='WEBHOOK' || op.kind==='LEASE_WRITE')return state;throw new Error(`ILLEGAL_TRANSITION:${state}:${op.kind}`)}
export function executeCase(seed:number,operations:Operation[],faults:Fault[]):LabResult{let state='NEW';const steps:Step[]=[];const latency:number[]=[];let failures=0;const workingOperations=operations.map(x=>({...x}));
 for(let i=0;i<workingOperations.length;i++){const op=workingOperations[i];const fault=faults.find(f=>f.at===i);const before=state;let effective=op;let ok=true;let error:string|undefined;
  const t=performance.now();try{if(fault?.kind==='DROP'){ok=false;error='INJECTED_DROP';failures++;}else if(fault?.kind==='THROW'){throw new Error('INJECTED_THROW')}else{state=transition(state,effective);if(fault?.kind==='DUPLICATE')state=transition(state,effective);}}
  catch(e){ok=false;error=e instanceof Error?e.message:String(e);failures++}latency.push(Math.max(1,Math.round(performance.now()-t)));
  steps.push({index:i,operation:op,stateBefore:before,stateAfter:state,injectedFault:fault ?? undefined,ok,error});
  if(fault?.kind==='REORDER' && i+1<operations.length){[workingOperations[i],workingOperations[i+1]]=[workingOperations[i+1],workingOperations[i]]}
 }
 const invariant = state==='CLOSED'||state==='PROCESSED'||state==='OPEN' ? null : 'STATE_TERMINAL_INVALID';
 if(invariant) failures++;
 const sorted=[...latency].sort((a,b)=>a-b);const p95=sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]||0; return {status:failures?'FAIL':'PASS',seed,operations:workingOperations,faults:faults.map(x=>({...x})),steps,invariant,failure:steps.find(s=>!s.ok)?.error ?? invariant ?? undefined,latencyMs:latency,slo:{errorRate:failures/Math.max(1,workingOperations.length),p95Ms:p95,availability:1-failures/Math.max(1,workingOperations.length),budgetConsumedPct:Math.min(100,failures/Math.max(1,workingOperations.length)*100)},fingerprint:digest({seed,operations:workingOperations,faults,steps,invariant})}
}

export function shrinkFailure(seed:number,operations:Operation[],faults:Fault[]):LabResult{let current=operations.slice();let currentFaults=faults.slice();let best=executeCase(seed,current,currentFaults);if(best.status==='PASS')return best;let changed=true;while(changed && current.length>1){changed=false;for(let i=0;i<current.length;i++){const candidate=current.slice(0,i).concat(current.slice(i+1));const ids=new Set(candidate.map(x=>x.id));const ff=currentFaults.filter(f=>ids.has(f.operationId)).map(f=>({...f,at:candidate.findIndex(x=>x.id===f.operationId)}));const r=executeCase(seed,candidate,ff);if(r.status==='FAIL'){current=candidate;currentFaults=ff;best=r;changed=true;break}}}return best}

export function replay(result:LabResult){return executeCase(result.seed,result.operations.map(x=>({...x})),result.faults.map(x=>({...x})))}
