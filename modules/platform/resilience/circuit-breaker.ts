export type CircuitState='CLOSED'|'OPEN'|'HALF_OPEN';
export type Circuit={state:CircuitState; failures:number; openedAt?:number};
export function allowRequest(c:Circuit, now=Date.now(), cooldownMs=30_000){
  if(c.state==='CLOSED') return true;
  if(c.state==='OPEN' && c.openedAt!==undefined && now-c.openedAt>=cooldownMs){c.state='HALF_OPEN';return true;}
  return c.state==='HALF_OPEN';
}
export function recordSuccess(c:Circuit){c.state='CLOSED';c.failures=0;delete c.openedAt;return c;}
export function recordFailure(c:Circuit, threshold=5, now=Date.now()){c.failures+=1;if(c.failures>=threshold){c.state='OPEN';c.openedAt=now;}return c;}
