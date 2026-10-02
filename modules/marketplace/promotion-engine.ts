export type PromotionPolicy = 'EXCLUSIVE' | 'STACK_DEAL' | 'STACK_ALL';
export type DynamicPricingContext = {
  stock?: number;
  demandVelocity?: number;
  conversionRate?: number;
  competitorPrice?: number;
  elasticity?: number;
  minutesSinceLastChange?: number;
  minDwellMinutes?: number;
  sellerMaxChangeBps?: number;
  approvalThresholdBps?: number;
};

const n=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));

export function calculateDiscount(base:number, type:'PERCENT'|'FIXED', bps?:number, amount?:number){
  const value=Math.max(0,n(base));
  return Number((type==='PERCENT' ? value*clamp(n(bps),0,9000)/10000 : Math.min(value,Math.max(0,n(amount)))).toFixed(2));
}

export function shouldApplyCoupon(policy:PromotionPolicy, hasDeal:boolean, hasVoucher=false){
  if(hasVoucher) return false;
  if(policy==='EXCLUSIVE') return !hasDeal;
  if(policy==='STACK_DEAL') return true;
  return true;
}

export function evaluateDynamicPrice(base:number, rule:{enabled:boolean;minPrice:number;maxPrice:number;maxAdjustmentBps:number}, ctx:DynamicPricingContext={}){
  const price=Math.max(0,n(base));
  if(!rule.enabled) return {price:Number(price.toFixed(2)),adjustmentBps:0,reason:'DISABLED',eligible:false};
  const minPrice=Math.max(0,n(rule.minPrice));
  const maxPrice=Math.max(minPrice,n(rule.maxPrice));
  const configuredMax=clamp(n(rule.maxAdjustmentBps),0,3000);
  const sellerCap=ctx.sellerMaxChangeBps===undefined?configuredMax:clamp(n(ctx.sellerMaxChangeBps),0,configuredMax);
  const cooldown=(ctx.minDwellMinutes??0)>0 && (ctx.minutesSinceLastChange??Infinity)<(ctx.minDwellMinutes??0);
  if(cooldown) return {price:Number(clamp(price,minPrice,maxPrice).toFixed(2)),adjustmentBps:0,reason:'COOLDOWN',eligible:false};

  let adjustment=0;
  const stock=n(ctx.stock);
  if(ctx.stock!==undefined){ if(stock<=0) adjustment+=200; else if(stock<=5) adjustment+=100; else if(stock>=100) adjustment-=100; }
  const demand=n(ctx.demandVelocity); if(demand>20) adjustment+=Math.min(300,Math.round((demand-20)*10)); else if(demand>0&&demand<2) adjustment-=Math.min(200,Math.round((2-demand)*50));
  const conversion=n(ctx.conversionRate); if(conversion>0.12) adjustment+=100; else if(conversion>0&&conversion<0.02) adjustment-=100;
  if(ctx.competitorPrice!==undefined && n(ctx.competitorPrice)>0){ const gap=(n(ctx.competitorPrice)-price)/price; adjustment+=Math.round(clamp(gap*10000,-200,200)); }
  if(ctx.elasticity!==undefined && n(ctx.elasticity)<0) adjustment=Math.round(adjustment*clamp(Math.abs(n(ctx.elasticity)),0.25,2));
  adjustment=clamp(adjustment,-sellerCap,sellerCap);
  const next=Number(clamp(price*(1+adjustment/10000),minPrice,maxPrice).toFixed(2));
  const approval=Math.max(0,n(ctx.approvalThresholdBps??0));
  const needsApproval=Math.abs(adjustment)>=approval && approval>0;
  return {price:next,adjustmentBps:Math.round(((next/price)-1)*10000),reason:'SIGNAL_ENGINE',eligible:true,needsApproval};
}
