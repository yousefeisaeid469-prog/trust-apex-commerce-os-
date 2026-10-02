export type DomainEvent = { type:string; version:number; payload:Record<string,unknown> };
export type AggregateReducer<S> = (state:S,event:DomainEvent)=>S;
export function replayAggregate<S>(events:DomainEvent[], initial:S, reducer:AggregateReducer<S>):S {
  let state=initial; let expected=1;
  for(const event of events){ if(event.version!==expected) throw new Error('AGGREGATE_VERSION_GAP'); state=reducer(state,event); expected++; }
  return state;
}
