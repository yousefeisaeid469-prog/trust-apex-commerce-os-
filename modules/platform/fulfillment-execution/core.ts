import { withPgTransaction, query } from '@/modules/platform/db/postgres';
import { createShipment, type ShipmentStatus } from '@/modules/platform/fulfillment-tracking-3';

const transitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  PLANNED: ['LABEL_CREATED','CANCELLED','EXCEPTION'],
  LABEL_CREATED: ['PICKED_UP','CANCELLED','EXCEPTION'],
  PICKED_UP: ['IN_TRANSIT','CANCELLED','EXCEPTION'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY','DELIVERED','EXCEPTION','CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED','EXCEPTION'],
  DELIVERED: [],
  EXCEPTION: ['IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'],
  CANCELLED: [],
};

export function canTransitionShipment(from: ShipmentStatus, to: ShipmentStatus) {
  return from === to || transitions[from]?.includes(to) === true;
}

export async function getShipment(shipmentId: string) {
  const result = await query(`select id,order_id,fulfillment_order_id,carrier,service,tracking_number,status,warehouse_id,destination,eta_at,created_at,updated_at from trust_shipments where id=$1`, [shipmentId]);
  return result.rows[0] ?? null;
}

export async function planShipment(input: { orderId:string; carrier:string; service:string; warehouseId?:string; destination?:unknown; etaAt?:string }) {
  if (!input.orderId || !input.carrier?.trim() || !input.service?.trim()) throw new Error('SHIPMENT_FIELDS_REQUIRED');
  const existing = await query(`select id,status from trust_shipments where order_id=$1 and status not in ('DELIVERED','CANCELLED') order by created_at desc limit 1`, [input.orderId]);
  if (existing.rows[0]) throw new Error('ACTIVE_SHIPMENT_EXISTS');
  return createShipment(input);
}

export async function transitionShipment(input: { shipmentId:string; to:ShipmentStatus; description?:string; location?:string; etaAt?:string }) {
  return withPgTransaction(async tx => {
    const current = (await tx.query<{status:ShipmentStatus;order_id:string}>(`select status,order_id from trust_shipments where id=$1 for update`, [input.shipmentId])).rows[0];
    if (!current) throw new Error('SHIPMENT_NOT_FOUND');
    if (!canTransitionShipment(current.status, input.to)) throw new Error(`INVALID_SHIPMENT_TRANSITION:${current.status}->${input.to}`);
    if (current.status === input.to) return { duplicate: true, status: current.status };
    const occurredAt = new Date().toISOString();
    const eventId = `${input.shipmentId}:${occurredAt}:${input.to}:${input.description ?? ''}`;
    await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,location,description,eta_at) values($1,$2,'STATUS',$3,$4,$5,$6,$7)`, [eventId,input.shipmentId,input.to,occurredAt,input.location ?? null,input.description ?? null,input.etaAt ?? null]);
    await tx.query(`update trust_shipments set status=$1,eta_at=coalesce($2,eta_at),updated_at=now() where id=$3`, [input.to,input.etaAt ?? null,input.shipmentId]);
    const order = (await tx.query<{status:string}>(`select status from trust_orders where id=$1 for update`, [current.order_id])).rows[0];
    if (order) {
      const shipmentSummary=(await tx.query<{total:string;delivered:string;active:string;moving:string}>(`
        select count(*)::text total,
               count(*) filter (where status='DELIVERED')::text delivered,
               count(*) filter (where status not in ('CANCELLED'))::text active,
               count(*) filter (where status in ('PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'))::text moving
        from trust_shipments where order_id=$1`,[current.order_id])).rows[0];
      const total=Number(shipmentSummary?.total??0);
      const delivered=Number(shipmentSummary?.delivered??0);
      const active=Number(shipmentSummary?.active??0);
      const moving=Number(shipmentSummary?.moving??0);
      const orderStatus = active>0 && delivered===active ? 'delivered' : moving>0 ? 'shipped' : input.to==='EXCEPTION' ? 'processing' : null;
      if (orderStatus && order.status !== orderStatus) {
        await tx.query(`update trust_orders set status=$1,updated_at=now() where id=$2`, [orderStatus,current.order_id]);
        await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,$3,'fulfillment_execution',$4)`, [current.order_id,order.status,orderStatus,input.description ?? `Shipment ${input.to.toLowerCase()}${total>1?' (multi-shipment aggregate)':''}`]);
      }
    }
    return { duplicate:false, status:input.to, shipmentId:input.shipmentId };
  });
}

export async function shipmentTimeline(shipmentId: string) {
  const rows = await query(`select id,event_type,status,exception_code,occurred_at,location,description,eta_at from trust_shipment_tracking_events where shipment_id=$1 order by occurred_at asc`, [shipmentId]);
  return rows.rows;
}
