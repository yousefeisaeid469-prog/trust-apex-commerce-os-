export type Operation = { id:string; key:string; tenantId:string; action:'read'|'write'; expectedVersion:number; delta:number };
export type Result = { id:string; accepted:boolean; reason:string; version:number };

/** Deterministic concurrency laboratory: models optimistic concurrency without sleeping or races. */
export function runConcurrencyLab(initialVersion:number, ops:Operation[]):Result[] {
  let version=initialVersion;
  const seen=new Set<string>();
  return ops.map(op=>{
    if(seen.has(op.id)) return {id:op.id,accepted:false,reason:'DUPLICATE_OPERATION',version};
    seen.add(op.id);
    if(op.expectedVersion!==version) return {id:op.id,accepted:false,reason:'VERSION_CONFLICT',version};
    if(op.action==='write') version++;
    return {id:op.id,accepted:true,reason:'ACCEPTED',version};
  });
}

export function assertSerializable(results:Result[]):void {
  let last=-1;
  for(const r of results){
    if(r.accepted && r.version<last) throw new Error('CONCURRENCY_ORDER_VIOLATION');
    last=Math.max(last,r.version);
  }
}
