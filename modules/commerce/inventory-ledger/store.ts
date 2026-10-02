export type InventoryEvent={id:string;productId:string;delta:number;reason:string;referenceId?:string;createdAt:string};
const events:InventoryEvent[]=[];
export function recordInventoryEvent(input:Omit<InventoryEvent,'id'|'createdAt'>){const e={...input,id:`inv_${crypto.randomUUID()}`,createdAt:new Date().toISOString()};events.push(e);return e;}
export function inventoryHistory(productId:string){return events.filter(e=>e.productId===productId).slice(-100).reverse();}
