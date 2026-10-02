import { createHash } from 'node:crypto';

export type StoredEvent<T=unknown> = { sequence:number; eventId:string; aggregateId:string; tenantId:string; type:string; version:number; occurredAt:string; correlationId:string; causationId?:string; payload:T; previousHash:string; hash:string };

function canonical(event: Omit<StoredEvent,'hash'>): string { return JSON.stringify(event); }
export function eventHash(event: Omit<StoredEvent,'hash'>): string { return createHash('sha256').update(canonical(event)).digest('hex'); }

export function appendEvent<T>(log: readonly StoredEvent<T>[], input: Omit<StoredEvent<T>,'sequence'|'previousHash'|'hash'>): StoredEvent<T> {
  const previousHash = log.at(-1)?.hash ?? 'GENESIS';
  const sequence = (log.at(-1)?.sequence ?? 0) + 1;
  const candidate = { ...input, sequence, previousHash };
  return { ...candidate, hash: eventHash(candidate) };
}

export function verifyEventChain(log: readonly StoredEvent[]): { ok:boolean; brokenAt?:number } {
  let previousHash = 'GENESIS';
  let previousSequence = 0;
  for (const event of log) {
    if (event.sequence !== previousSequence + 1 || event.previousHash !== previousHash || event.hash !== eventHash(((({ hash: _hash, ...rest }) => rest)(event)) as Omit<StoredEvent,'hash'>)) return { ok:false, brokenAt:event.sequence };
    previousHash = event.hash; previousSequence = event.sequence;
  }
  return { ok:true };
}

export function replay<T>(log: readonly StoredEvent<T>[], aggregateId:string, reducer:(state:T,event:StoredEvent)=>T, initial:T): T {
  return log.filter(e=>e.aggregateId===aggregateId).reduce(reducer, initial);
}
