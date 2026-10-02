import type {DeliveryPromise,FulfillmentPlan,InventoryNode,OrderLine,ReturnDecision,ReturnRequest,DeliveryRoute,Warehouse} from './contracts.ts';

export function routeWarehouses(warehouses:Warehouse[], nodes:InventoryNode[], lines:OrderLine[], opts:{region?:string; maxEtaDays?:number; mode?:'SHIP'|'PICKUP'|'DELIVERY'}={}):DeliveryRoute[]{
  const need=new Map(lines.map(l=>[l.productId,l.quantity]));
  return warehouses.filter(w=>w.active&&(!opts.region||w.region===opts.region)).map(w=>{
    let fill=0; for(const [pid,q] of need){const n=nodes.find(x=>x.warehouseId===w.id&&x.productId===pid); if(n&&n.available-n.reserved+n.inbound>=q)fill+=q;}
    const distanceKm=Math.hypot(w.lat,w.lon); const capacityPenalty=Math.max(0,(w.capacityUnits-w.availableUnits)/Math.max(1,w.capacityUnits))*20;
    const etaDays=Math.max(1,Math.ceil(w.handlingHours/24)+(fill===lines.reduce((s,l)=>s+l.quantity,0)?1:2));
    return {warehouseId:w.id,region:w.region,etaDays,distanceKm,costMinor:BigInt(Math.round(distanceKm*10)),score:fill*100-etaDays*12-distanceKm-capacityPenalty};
  }).filter(r=>!opts.maxEtaDays||r.etaDays<=opts.maxEtaDays).sort((a,b)=>b.score-a.score||a.etaDays-b.etaDays||a.warehouseId.localeCompare(b.warehouseId));
}

export function deliveryPromise(route:DeliveryRoute, now=new Date()):DeliveryPromise{return {warehouseId:route.warehouseId,etaDays:route.etaDays,cutoff:new Date(now.getTime()+route.etaDays*86400000).toISOString(),confidence:Math.max(.5,Math.min(.99,1-route.etaDays*.08)),mode:'SHIP'};}

export function planFulfillment(orderId:string, channel:FulfillmentPlan['channel'], lines:OrderLine[], warehouses:Warehouse[], nodes:InventoryNode[]):FulfillmentPlan{
  const remaining=new Map(lines.map(l=>[l.lineId,l.quantity])); const shipments=[];
  for(const w of warehouses.filter(x=>x.active)){
    const lineIds:string[]=[];
    for(const l of lines){const left=remaining.get(l.lineId)||0;if(!left)continue;const n=nodes.find(x=>x.warehouseId===w.id&&x.productId===l.productId);const available=(n?.available||0)-(n?.reserved||0)+(n?.inbound||0);if(available>=left){lineIds.push(l.lineId);remaining.set(l.lineId,0);}}
    if(lineIds.length)shipments.push({shipmentId:crypto.randomUUID(),warehouseId:w.id,lineIds,status:'PLANNED' as const,etaDays:Math.max(1,Math.ceil(w.handlingHours/24)+1),mode:'SHIP' as const});
  }
  const unallocatedLineIds=lines.filter(l=>(remaining.get(l.lineId)||0)>0).map(l=>l.lineId); return {orderId,channel,shipments,unallocatedLineIds,totalEtaDays:shipments.length?Math.max(...shipments.map(s=>s.etaDays)):0,splitCount:shipments.length};
}

export function decideReturn(r:ReturnRequest, now=new Date(), item:{unitPriceMinor:bigint;resellable?:boolean;inspectionRequired?:boolean}):ReturnDecision{
  if(new Date(r.eligibleUntil).getTime()<now.getTime())return {approved:false,disposition:'INVESTIGATE',refundMinor:0n,requiresInspection:true,reason:'return window expired'};
  if(r.quantity<1)return {approved:false,disposition:'INVESTIGATE',refundMinor:0n,requiresInspection:true,reason:'invalid quantity'};
  const inspect=r.reason==='DAMAGED'||r.reason==='NOT_AS_DESCRIBED'||item.inspectionRequired===true; const disposition=inspect?'INVESTIGATE':item.resellable===false?'LIQUIDATE':'RESTOCK';
  return {approved:true,disposition,refundMinor:item.unitPriceMinor*BigInt(r.quantity),requiresInspection:inspect,reason:inspect?'inspection required before final disposition':'eligible for standard return'};
}
