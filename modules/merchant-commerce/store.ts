import { createHash } from 'node:crypto';
import { query, withPgTransaction } from '../platform/db/postgres';
import { appendAuditEvent } from '../platform/audit/service';

export type MerchantCommerceRecord = {
  id:string; merchantId:string; recordType:string; recordKey:string; status:string;
  amount:number; quantity:number; score:number; metadata:Record<string,unknown>; createdAt:string; updatedAt:string;
};
export type InventoryBalance = { merchantId:string; sku:string; warehouseCode:string; onHand:number; reserved:number; damaged:number; reorderPoint:number; version:number };
export type ControlAlert = { id:string; merchantId:string; alertType:string; severity:string; title:string; detail:string; status:string; createdAt:string };
export type ControlSnapshot = { merchantId:string; healthScore:number; metrics:Record<string,unknown>; generatedAt:string };

const clean=(value:unknown,max=160)=>String(value??'').trim().slice(0,max);
const money=(value:unknown)=>Math.max(0,Number.isFinite(Number(value))?Number(value):0);
const qty=(value:unknown)=>Number.isFinite(Number(value))?Number(value):0;
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rowRecord=(r:any):MerchantCommerceRecord=>({id:String(r.id),merchantId:String(r.merchant_id),recordType:String(r.record_type),recordKey:String(r.record_key),status:String(r.status),amount:Number(r.amount),quantity:Number(r.quantity),score:Number(r.score),metadata:r.metadata_json??{},createdAt:new Date(r.created_at).toISOString(),updatedAt:new Date(r.updated_at).toISOString()});

export async function upsertCommerceRecord(input:{merchantId:string;recordType:string;recordKey:string;status:string;amount?:number;quantity?:number;score?:number;metadata?:Record<string,unknown>}){
  const merchantId=clean(input.merchantId); const recordType=clean(input.recordType); const recordKey=clean(input.recordKey);
  if(!merchantId)throw new Error('MERCHANT_REQUIRED'); if(!recordType)throw new Error('RECORD_TYPE_REQUIRED'); if(!recordKey)throw new Error('RECORD_KEY_REQUIRED');
  const result=await query(`insert into trust_merchant_commerce_records(merchant_id,record_type,record_key,status,amount,quantity,score,metadata_json) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb) on conflict(merchant_id,record_type,record_key) do update set status=excluded.status,amount=excluded.amount,quantity=excluded.quantity,score=excluded.score,metadata_json=excluded.metadata_json,updated_at=now() returning *`,[merchantId,recordType,recordKey,clean(input.status,60),money(input.amount),qty(input.quantity),Math.max(0,Math.min(100,money(input.score))),JSON.stringify(input.metadata??{})]);
  return rowRecord(result.rows[0]);
}

export async function getCommerceRecord(merchantId:string,recordType:string,recordKey:string){
  const result=await query(`select * from trust_merchant_commerce_records where merchant_id=$1 and record_type=$2 and record_key=$3 limit 1`,[clean(merchantId),clean(recordType),clean(recordKey)]);
  return result.rows[0]?rowRecord(result.rows[0]):undefined;
}

export async function listCommerceRecords(merchantId:string,recordType?:string,limit=100){
  const safe=Math.min(Math.max(Math.floor(limit),1),500);
  const result=await query(`select * from trust_merchant_commerce_records where merchant_id=$1 and ($2::text is null or record_type=$2) order by updated_at desc limit $3`,[clean(merchantId),recordType?clean(recordType):null,safe]);
  return result.rows.map(rowRecord);
}

export async function appendMerchantEvent(input:{merchantId:string;actorId?:string;eventType:string;aggregateType:string;aggregateId:string;payload?:unknown}){
  const merchantId=clean(input.merchantId); const eventType=clean(input.eventType); const aggregateType=clean(input.aggregateType); const aggregateId=clean(input.aggregateId);
  if(!merchantId||!eventType||!aggregateType||!aggregateId)throw new Error('EVENT_FIELDS_REQUIRED');
  const fingerprint=hash({merchantId,eventType,aggregateType,aggregateId,payload:input.payload??{}});
  const result=await query(`insert into trust_merchant_operating_events(merchant_id,actor_id,event_type,aggregate_type,aggregate_id,fingerprint,payload_json) values($1,$2,$3,$4,$5,$6,$7::jsonb) on conflict(fingerprint) do update set fingerprint=excluded.fingerprint returning id,created_at`,[merchantId,input.actorId??null,eventType,aggregateType,aggregateId,fingerprint,JSON.stringify(input.payload??{})]);
  return {id:String(result.rows[0].id),fingerprint,createdAt:new Date(result.rows[0].created_at).toISOString()};
}

export async function adjustInventory(input:{merchantId:string;sku:string;warehouseCode?:string;delta:number;movementType:string;referenceType?:string;referenceId?:string;actorId?:string;idempotencyKey:string;metadata?:Record<string,unknown>}):Promise<InventoryBalance>{
  const merchantId=clean(input.merchantId); const sku=clean(input.sku); const warehouse=clean(input.warehouseCode??'DEFAULT',80); const delta=qty(input.delta);
  if(!merchantId||!sku)throw new Error('INVENTORY_FIELDS_REQUIRED'); if(delta===0)throw new Error('INVENTORY_DELTA_ZERO'); if(!clean(input.idempotencyKey,180))throw new Error('IDEMPOTENCY_REQUIRED');
  return withPgTransaction(async client=>{
    const existing=await client.query(`select * from trust_merchant_inventory_movements where merchant_id=$1 and idempotency_key=$2 for update`,[merchantId,clean(input.idempotencyKey,180)]);
    if(existing.rows[0]){
      const balance=await client.query(`select merchant_id,sku,warehouse_code,on_hand,reserved,damaged,reorder_point,version from trust_merchant_inventory_balances where merchant_id=$1 and sku=$2 and warehouse_code=$3 for update`,[merchantId,sku,warehouse]);
      if(!balance.rows[0])throw new Error('INVENTORY_BALANCE_MISSING'); return mapBalance(balance.rows[0]);
    }
    const balance=await client.query(`insert into trust_merchant_inventory_balances(merchant_id,sku,warehouse_code) values($1,$2,$3) on conflict(merchant_id,sku,warehouse_code) do update set updated_at=now() returning *`,[merchantId,sku,warehouse]);
    const current=balance.rows[0]; const available=Number(current.on_hand)-Number(current.reserved); if(delta<0 && available+delta<0)throw new Error('INVENTORY_UNDERFLOW');
    const next=await client.query(`update trust_merchant_inventory_balances set on_hand=on_hand+$1,version=version+1,updated_at=now() where id=$2 returning merchant_id,sku,warehouse_code,on_hand,reserved,damaged,reorder_point,version`,[delta,current.id]);
    await client.query(`insert into trust_merchant_inventory_movements(merchant_id,sku,warehouse_code,movement_type,quantity,reference_type,reference_id,idempotency_key,actor_id,metadata_json) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,[merchantId,sku,warehouse,clean(input.movementType,80),delta,input.referenceType?clean(input.referenceType,80):null,input.referenceId?clean(input.referenceId,120):null,clean(input.idempotencyKey,180),input.actorId??null,JSON.stringify(input.metadata??{})]);
    return mapBalance(next.rows[0]);
  });
}

const mapBalance=(r:any):InventoryBalance=>({merchantId:String(r.merchant_id),sku:String(r.sku),warehouseCode:String(r.warehouse_code),onHand:Number(r.on_hand),reserved:Number(r.reserved),damaged:Number(r.damaged),reorderPoint:Number(r.reorder_point),version:Number(r.version)});

export async function reserveInventory(input:{merchantId:string;sku:string;warehouseCode?:string;quantity:number;referenceType:string;referenceId:string;expiresAt?:string}){
  const merchantId=clean(input.merchantId); const sku=clean(input.sku); const warehouse=clean(input.warehouseCode??'DEFAULT',80); const amount=qty(input.quantity);
  if(amount<=0)throw new Error('RESERVATION_QUANTITY_INVALID');
  return withPgTransaction(async client=>{
    const row=await client.query(`select * from trust_merchant_inventory_balances where merchant_id=$1 and sku=$2 and warehouse_code=$3 for update`,[merchantId,sku,warehouse]);
    if(!row.rows[0])throw new Error('INVENTORY_BALANCE_MISSING'); const current=row.rows[0];
    if(Number(current.on_hand)-Number(current.reserved)<amount)throw new Error('INSUFFICIENT_AVAILABLE_STOCK');
    const duplicate=await client.query(`select * from trust_merchant_inventory_reservations where merchant_id=$1 and reference_type=$2 and reference_id=$3 and sku=$4 and warehouse_code=$5 for update`,[merchantId,clean(input.referenceType,80),clean(input.referenceId,120),sku,warehouse]);
    if(duplicate.rows[0])return duplicate.rows[0];
    await client.query(`update trust_merchant_inventory_balances set reserved=reserved+$1,version=version+1,updated_at=now() where id=$2`,[amount,current.id]);
    const result=await client.query(`insert into trust_merchant_inventory_reservations(merchant_id,sku,warehouse_code,reference_type,reference_id,quantity,expires_at) values($1,$2,$3,$4,$5,$6,$7) returning *`,[merchantId,sku,warehouse,clean(input.referenceType,80),clean(input.referenceId,120),amount,input.expiresAt??null]);
    return result.rows[0];
  });
}

export async function releaseInventoryReservation(reservationId:string,reason='RELEASED'){
  return withPgTransaction(async client=>{
    const row=await client.query(`select * from trust_merchant_inventory_reservations where id=$1 for update`,[clean(reservationId)]);
    if(!row.rows[0])throw new Error('RESERVATION_NOT_FOUND'); const reservation=row.rows[0];
    if(reservation.status!=='RESERVED')return reservation;
    const balance=await client.query(`select * from trust_merchant_inventory_balances where merchant_id=$1 and sku=$2 and warehouse_code=$3 for update`,[reservation.merchant_id,reservation.sku,reservation.warehouse_code]);
    if(!balance.rows[0])throw new Error('INVENTORY_BALANCE_MISSING');
    if(Number(balance.rows[0].reserved)<Number(reservation.quantity))throw new Error('RESERVED_STOCK_UNDERFLOW');
    await client.query(`update trust_merchant_inventory_balances set reserved=reserved-$1,version=version+1,updated_at=now() where id=$2`,[reservation.quantity,balance.rows[0].id]);
    const result=await client.query(`update trust_merchant_inventory_reservations set status=$1,released_at=now() where id=$2 returning *`,[clean(reason,60),reservation.id]);
    return result.rows[0];
  });
}

export async function createControlAlert(input:{merchantId:string;alertType:string;severity:string;title:string;detail?:string;dedupeKey:string}){
  const result=await query(`insert into trust_merchant_control_alerts(merchant_id,alert_type,severity,title,detail,dedupe_key) values($1,$2,$3,$4,$5,$6) on conflict(merchant_id,dedupe_key) do update set detail=excluded.detail,severity=excluded.severity,updated_at=now() where trust_merchant_control_alerts.status='OPEN' returning *`,[clean(input.merchantId),clean(input.alertType,80),clean(input.severity,40),clean(input.title,180),clean(input.detail??'',1000),clean(input.dedupeKey,180)]);
  if(!result.rows[0]){const existing=await query(`select * from trust_merchant_control_alerts where merchant_id=$1 and dedupe_key=$2`,[clean(input.merchantId),clean(input.dedupeKey,180)]);return existing.rows[0];}
  return result.rows[0];
}

export async function acknowledgeAlert(merchantId:string,alertId:string,actorId:string){
  const result=await query(`update trust_merchant_control_alerts set status='ACKNOWLEDGED',acknowledged_by=$1,acknowledged_at=now(),updated_at=now() where id=$2 and merchant_id=$3 and status='OPEN' returning *`,[actorId,alertId,merchantId]);
  if(!result.rows[0])throw new Error('ALERT_NOT_OPEN'); await appendAuditEvent({actorId,action:'merchant.alert.acknowledge',resourceType:'merchant_control_alert',resourceId:alertId,payload:{merchantId}}); return result.rows[0];
}

export async function resolveAlert(merchantId:string,alertId:string,actorId:string){
  const result=await query(`update trust_merchant_control_alerts set status='RESOLVED',resolved_by=$1,resolved_at=now(),updated_at=now() where id=$2 and merchant_id=$3 and status in('OPEN','ACKNOWLEDGED') returning *`,[actorId,alertId,merchantId]);
  if(!result.rows[0])throw new Error('ALERT_NOT_RESOLVABLE'); await appendAuditEvent({actorId,action:'merchant.alert.resolve',resourceType:'merchant_control_alert',resourceId:alertId,payload:{merchantId}}); return result.rows[0];
}

export async function buildControlSnapshot(merchantId:string):Promise<ControlSnapshot>{
  const id=clean(merchantId);
  const [inventory,orders,payouts,alerts,risk,compliance]=await Promise.all([
    query(`select count(*)::int total,count(*) filter(where on_hand-reserved<=0)::int out,count(*) filter(where on_hand-reserved>0 and on_hand-reserved<=reorder_point)::int low from trust_merchant_inventory_balances where merchant_id=$1`,[id]),
    query(`select count(*)::int total,count(*) filter(where status in('DELIVERED'))::int delivered from trust_merchant_commerce_records where merchant_id=$1 and record_type='order'`,[id]),
    query(`select coalesce(sum(amount),0)::numeric exposure from trust_merchant_payout_ledger where merchant_id=$1`,[id]),
    query(`select count(*)::int total,count(*) filter(where status='OPEN')::int open from trust_merchant_control_alerts where merchant_id=$1`,[id]),
    query(`select score,status from trust_merchant_risk_assessments where merchant_id=$1 order by created_at desc limit 1`,[id]),
    query(`select count(*)::int total,count(*) filter(where status='VERIFIED')::int verified from trust_merchant_compliance_cases where merchant_id=$1`,[id]),
  ]);
  const inv=inventory.rows[0], ord=orders.rows[0], pay=payouts.rows[0], al=alerts.rows[0], rk=risk.rows[0], cp=compliance.rows[0];
  const fulfillment=Number(ord.total)?Number(ord.delivered)/Number(ord.total)*100:100; const availability=Number(inv.total)?(Number(inv.total)-Number(inv.out))/Number(inv.total)*100:100;
  const complianceRate=Number(cp.total)?Number(cp.verified)/Number(cp.total)*100:100; const riskScore=rk?Math.max(0,100-Number(rk.score)):100; const alertPenalty=Math.min(35,Number(al.open)*7);
  const health=Math.max(0,Math.min(100,availability*.25+fulfillment*.25+complianceRate*.2+riskScore*.2+Math.max(0,100-alertPenalty)*.1));
  const metrics={inventory:{total:Number(inv.total),out:Number(inv.out),low:Number(inv.low)},orders:{total:Number(ord.total),delivered:Number(ord.delivered),fulfillment},payoutExposure:Number(pay.exposure),alerts:{total:Number(al.total),open:Number(al.open)},risk:{score:rk?Number(rk.score):0,status:rk?.status??'CLEAR'},compliance:{total:Number(cp.total),verified:Number(cp.verified),rate:complianceRate}};
  const result=await query(`insert into trust_merchant_control_snapshots(merchant_id,health_score,metrics_json) values($1,$2,$3::jsonb) returning merchant_id,health_score,metrics_json,generated_at`,[id,health,JSON.stringify(metrics)]);
  return {merchantId:id,healthScore:Number(result.rows[0].health_score),metrics:result.rows[0].metrics_json,generatedAt:new Date(result.rows[0].generated_at).toISOString()};
}

export async function listControlAlerts(merchantId:string,status?:string,limit=100){
  const safe=Math.min(Math.max(Math.floor(limit),1),300); const result=await query(`select id,merchant_id,alert_type,severity,title,detail,status,created_at from trust_merchant_control_alerts where merchant_id=$1 and ($2::text is null or status=$2) order by created_at desc limit $3`,[clean(merchantId),status?clean(status,40):null,safe]);
  return result.rows.map((r:any):ControlAlert=>({id:String(r.id),merchantId:String(r.merchant_id),alertType:String(r.alert_type),severity:String(r.severity),title:String(r.title),detail:String(r.detail),status:String(r.status),createdAt:new Date(r.created_at).toISOString()}));
}
