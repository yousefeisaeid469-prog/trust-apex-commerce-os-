import {createHash} from 'node:crypto';
import type {ReplayEvent,ReplayResult} from './contracts.ts';
export function canonicalize(value:unknown):string{
  if(value===null||typeof value!=='object')return JSON.stringify(value,(k,v)=>typeof v==='bigint'?`${v}n`:v);
  if(Array.isArray(value))return `[${value.map(canonicalize).join(',')}]`;
  const obj=value as Record<string,unknown>;
  return `{${Object.keys(obj).sort().map(k=>`${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}
export function replay(events:ReplayEvent[],apply:(state:Record<string,unknown>,event:ReplayEvent)=>Record<string,unknown>,initial:Record<string,unknown>={}):ReplayResult{const ordered=[...events].sort((a,b)=>a.sequence-b.sequence);let state={...initial};for(const e of ordered)state=apply(state,e);const stateHash=createHash('sha256').update(canonicalize(state)).digest('hex');const second=ordered.reduce((s,e)=>apply(s,e),{...initial});const secondHash=createHash('sha256').update(canonicalize(second)).digest('hex');return {eventCount:ordered.length,deterministic:stateHash===secondHash,stateHash};}
