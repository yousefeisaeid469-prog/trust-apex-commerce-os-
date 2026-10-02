import type {AllocationNode,AllocationPlan,DemandForecast,DemandSignal,LandedCost,LandedCostInput,PurchaseOrder,PurchaseOrderLine,ReplenishmentPlan,Supplier,SupplierRecommendation,SupplyPosition} from './contracts.ts';

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function forecastDemand(productId:string,signals:DemandSignal[],horizonDays=14):DemandForecast{
  const clean=signals.filter(x=>Number.isFinite(x.quantity)&&x.quantity>=0&&Number.isFinite(x.weight??1));
  if(!clean.length)return {productId,horizonDays,dailyDemand:0,peakDailyDemand:0,confidence:0,method:'BASELINE'};
  const totalWeight=clean.reduce((s,x)=>s+(x.weight??1),0)||1;
  const dailyDemand=clean.reduce((s,x)=>s+x.quantity*(x.weight??1),0)/totalWeight;
  const peakDailyDemand=Math.max(...clean.map(x=>x.quantity),dailyDemand);
  const confidence=clamp(.55+Math.min(.35,clean.length*.03),0,.95);
  return {productId,horizonDays,dailyDemand,peakDailyDemand,confidence,method:'WEIGHTED_HISTORY'};
}
export function planReplenishment(forecast:DemandForecast,position:SupplyPosition):ReplenishmentPlan{
  const available=Math.max(0,position.onHand-position.reserved)+Math.max(0,position.inbound);
  const target=Math.ceil(forecast.peakDailyDemand*(position.leadTimeDays+position.safetyDays+position.reviewDays));
  const qty=Math.max(0,target-available);
  const coverage=forecast.dailyDemand>0?available/forecast.dailyDemand:Infinity;
  const urgency=qty>0&&coverage<=position.leadTimeDays?'NOW':qty>0?'SOON':'HEALTHY';
  return {productId:forecast.productId,recommendedQuantity:qty,targetStock:target,projectedCoverageDays:coverage,urgency,reason:qty?'projected demand exceeds available supply during lead/review window':'available supply covers the modeled target'};
}
export function rankSuppliers(suppliers:Supplier[],region?:string,requiredUnits=1):SupplierRecommendation[]{
  return suppliers.map(s=>{
    const eligible=s.active&&s.risk!=='CRITICAL'&&s.capacityUnits>=requiredUnits&&s.minOrderQty<=requiredUnits&&(!region||s.regions.includes(region));
    if(!eligible)return {supplierId:s.supplierId,score:0,eligible:false,reason:'supplier fails capacity, MOQ, region, activity, or critical-risk policy'};
    const score=s.qualityScore*.35+s.onTimeScore*.3+s.priceScore*.2+(100-s.leadTimeDays*3)*.15;
    return {supplierId:s.supplierId,score,eligible:true,reason:'supplier meets procurement policy'};
  }).sort((a,b)=>b.score-a.score||a.supplierId.localeCompare(b.supplierId));
}
export function buildPurchaseOrder(purchaseOrderId:string,supplier:Supplier,currency:string,lines:PurchaseOrderLine[],status:PurchaseOrder['status']='DRAFT'):PurchaseOrder{
  if(!supplier.active||supplier.risk==='CRITICAL')throw new Error('supplier not eligible');
  if(!lines.length)throw new Error('purchase order requires lines');
  if(lines.some(l=>l.quantity<1||!Number.isInteger(l.quantity)||l.unitCostMinor<0n))throw new Error('invalid purchase order line');
  const subtotal=lines.reduce((s,l)=>s+l.unitCostMinor*BigInt(l.quantity),0n);
  return {purchaseOrderId,supplierId:supplier.supplierId,currency,lines,subtotalMinor:subtotal,status,expectedArrivalDays:supplier.leadTimeDays};
}
export function calculateLandedCost(input:LandedCostInput):LandedCost{
  if(input.quantity<1||!Number.isInteger(input.quantity))throw new Error('invalid quantity');
  const total=input.unitCostMinor*BigInt(input.quantity)+input.freightMinor+input.dutyMinor+input.taxMinor+input.otherMinor;
  if([input.unitCostMinor,input.freightMinor,input.dutyMinor,input.taxMinor,input.otherMinor].some(x=>x<0n))throw new Error('cost cannot be negative');
  return {totalMinor:total,unitLandedMinor:total/BigInt(input.quantity)};
}
export function allocateInventory(totalUnits:number,nodes:AllocationNode[],region?:string):AllocationPlan[]{
  if(totalUnits<=0||!Number.isInteger(totalUnits))return [];
  let remaining=totalUnits; const eligible=nodes.filter(n=>n.availableUnits>0&&n.capacityUnits>0&&(!region||n.region===region)).map(n=>({...n,score:n.distanceScore+(n.availableUnits/n.capacityUnits)*100})).sort((a,b)=>b.score-a.score||a.nodeId.localeCompare(b.nodeId));
  const result:AllocationPlan[]=[];
  for(const n of eligible){if(!remaining)break;const q=Math.min(remaining,n.availableUnits,n.capacityUnits);if(q>0){result.push({nodeId:n.nodeId,quantity:q,score:n.score,reason:'allocated to highest-ranked eligible node'});remaining-=q;}}
  return result;
}
