import type {Order} from '../core/types';
const orders:Order[]=[];
export function listOrders(){return [...orders].reverse();}
export function createOrder(input:Pick<Order,'customerId'|'items'|'subtotal'|'shipping'|'total'>):Order{const order:Order={...input,id:`ord_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,currency:'EGP',status:'pending',createdAt:new Date().toISOString()};orders.push(order);return order;}
export function getOrder(id:string){return orders.find(o=>o.id===id);}
