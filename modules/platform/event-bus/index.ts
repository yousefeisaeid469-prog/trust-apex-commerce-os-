export type DomainEventName =
  | 'order.created' | 'order.paid' | 'order.fulfilled' | 'order.cancelled'
  | 'payment.succeeded' | 'payment.failed' | 'inventory.low'
  | 'shipment.created' | 'shipment.delivered' | 'customer.updated'
  | 'merchant.updated' | 'agent.action.requested' | 'agent.action.completed';
export type DomainEvent<T=unknown>={id:string;name:DomainEventName;occurredAt:string;tenantId:string;aggregateId:string;correlationId:string;causationId?:string;payload:T;metadata?:Record<string,string>};
export type EventHandler<T=unknown>=(event:DomainEvent<T>)=>Promise<void>|void;
const handlers=new Map<DomainEventName,Set<EventHandler>>();
const recent:DomainEvent[]=[];
const id=()=>globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function subscribe(name:DomainEventName,handler:EventHandler){const set=handlers.get(name)??new Set<EventHandler>();set.add(handler);handlers.set(name,set);return()=>set.delete(handler)}
export async function publish<T>(input:Omit<DomainEvent<T>,'id'|'occurredAt'>){const event:DomainEvent<T>={...input,id:id(),occurredAt:new Date().toISOString()};recent.push(event);if(recent.length>100)recent.shift();for(const handler of handlers.get(event.name)??[]) await Promise.resolve(handler(event));return event}
export function eventSnapshot(){return recent.slice().reverse().map(e=>({id:e.id,name:e.name,aggregateId:e.aggregateId,occurredAt:e.occurredAt,tenantId:e.tenantId,correlationId:e.correlationId}))}
