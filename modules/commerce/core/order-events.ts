import type { OrderStatus } from './service';
import { emitCommerceEvent } from '../fulfillment/events';
export function recordOrderCreated(orderId: string, customerId: string, total: number) { return emitCommerceEvent('order.created', orderId, { customerId, total }); }
export function recordOrderStatusChanged(orderId: string, from: OrderStatus, to: OrderStatus) { return emitCommerceEvent('order.status_changed', orderId, { from, to }); }
