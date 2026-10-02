export type CommerceEvent={type:string;entityId:string;occurredAt:string;metadata?:Record<string,string|number|boolean>};
export function event(type:string,entityId:string,metadata?:CommerceEvent['metadata']):CommerceEvent{return {type,entityId,metadata,occurredAt:new Date().toISOString()};}
