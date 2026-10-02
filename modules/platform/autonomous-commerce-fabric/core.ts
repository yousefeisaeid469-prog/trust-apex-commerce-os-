import type {ActionContext,ActionDecision,AgentRecord,FabricOverview,FabricProduct,FabricSnapshot,FraudInput,RiskLevel,AutonomyLevel} from './contracts';
const levels:AutonomyLevel[]=['SUGGEST','APPROVAL_REQUIRED','AUTO_EXECUTE'];
const riskRank:Record<RiskLevel,number>={low:1,medium:2,high:3,critical:4};
export function registerAgent(existing:AgentRecord[],agent:AgentRecord):AgentRecord[]{
  if(!agent.agentId||!agent.tenantId||!agent.capabilities.length)throw new Error('INVALID_AGENT');
  if(agent.trustScore<0||agent.trustScore>1)throw new Error('INVALID_TRUST_SCORE');
  const next=existing.filter(a=>!(a.tenantId===agent.tenantId&&a.agentId===agent.agentId)); return [...next,agent];
}
export function authorizeAction(ctx:ActionContext,agent:AgentRecord|undefined):ActionDecision{
  if(!agent||agent.tenantId!==ctx.tenantId)return {allowed:false,approvalRequired:false,reason:'AGENT_NOT_TRUSTED',score:0,policyVersion:'179.1'};
  if(agent.status!=='ACTIVE')return {allowed:false,approvalRequired:false,reason:'AGENT_NOT_ACTIVE',score:0,policyVersion:'179.1'};
  if(!agent.capabilities.includes(ctx.capability))return {allowed:false,approvalRequired:false,reason:'CAPABILITY_DENIED',score:0,policyVersion:'179.1'};
  if(riskRank[ctx.risk]>riskRank[agent.maxRisk])return {allowed:false,approvalRequired:false,reason:'RISK_CEILING_EXCEEDED',score:0,policyVersion:'179.1'};
  if(ctx.confidence<0.8)return {allowed:false,approvalRequired:true,reason:'LOW_CONFIDENCE',score:ctx.confidence,policyVersion:'179.1'};
  if(ctx.estimatedCost<0||ctx.estimatedCost>ctx.budget)return {allowed:false,approvalRequired:false,reason:'BUDGET_EXCEEDED',score:0,policyVersion:'179.1'};
  if(!ctx.reversible&&agent.maxAutonomy==='AUTO_EXECUTE')return {allowed:false,approvalRequired:true,reason:'IRREVERSIBLE_ACTION',score:0,policyVersion:'179.1'};
  const score=Math.max(0,Math.min(1,ctx.confidence*0.7+agent.trustScore*0.3));
  const approvalRequired=levels.indexOf(agent.maxAutonomy)<levels.indexOf('AUTO_EXECUTE')||ctx.risk==='high';
  return {allowed:true,approvalRequired,reason:approvalRequired?'POLICY_APPROVAL':'AUTO_EXECUTE_ELIGIBLE',score,policyVersion:'179.1'};
}
export function fraudScore(input:FraudInput):number{
  const velocity=Math.min(100,Math.max(0,input.velocity)); const returns=Math.min(100,Math.max(0,input.returnRate)); const device=Math.min(100,Math.max(0,input.deviceRisk));
  const agePenalty=input.accountAgeDays<7?12:input.accountAgeDays<30?5:0; const mismatch=input.paymentMismatch?15:0; const ship=input.shippingMismatch?10:0;
  return Math.min(100,velocity*.22+returns*.22+device*.26+agePenalty+mismatch+ship);
}
export function fraudRisk(input:FraudInput):RiskLevel{return fraudScore(input)>=75?'critical':fraudScore(input)>=55?'high':fraudScore(input)>=35?'medium':'low';}
export function rankNextBestAction(actions:Array<{id:string;impact:number;confidence:number;cost:number;risk:RiskLevel;reversible:boolean}>){return [...actions].filter(a=>a.impact>=0&&a.confidence>=0&&a.confidence<=1&&a.cost>=0).sort((a,b)=>(b.impact*b.confidence-b.cost-riskRank[b.risk]*2+(b.reversible?2:0))-(a.impact*a.confidence-a.cost-riskRank[a.risk]*2+(a.reversible?2:0)));}
export function productScore(p:FabricProduct):number{const discount=p.oldPrice&&p.oldPrice>p.price?Math.min(1,(p.oldPrice-p.price)/p.oldPrice):0;const stock=p.stock>0?Math.min(1,p.stock/20):0;return p.rating/5*.5+discount*.15+stock*.1+Math.min(1,p.tags.length/6)*.05+.2;}
export function buildOverview(snapshot:FabricSnapshot):FabricOverview{
  const inventoryValue=snapshot.products.reduce((s,p)=>s+p.price*Math.max(0,p.stock),0); const averageRating=snapshot.products.length?snapshot.products.reduce((s,p)=>s+p.rating,0)/snapshot.products.length:0;
  const avgFraud=snapshot.fraudSignals.length?snapshot.fraudSignals.reduce((s,f)=>s+fraudScore(f),0)/snapshot.fraudSignals.length:0;
  const errorRate=snapshot.events?Math.min(1,snapshot.failedExecutions/snapshot.events):0; const autonomyRate=snapshot.agents.length?snapshot.agents.filter(a=>a.maxAutonomy==='AUTO_EXECUTE'&&a.status==='ACTIVE').length/snapshot.agents.length:0;
  const healthScore=Math.round(Math.max(0,100-errorRate*45-snapshot.pendingActions*.5+autonomyRate*20+(averageRating/5)*25));
  return {healthScore,autonomyRate,inventoryValue,averageRating,fraudRisk:avgFraud>=70?'high':avgFraud>=40?'medium':'low',topProducts:[...snapshot.products].map(p=>({...p,score:productScore(p),reason:p.oldPrice&&p.oldPrice>p.price?'Strong rating + active price advantage':'Strong rating + healthy availability'})).sort((a,b)=>b.score-a.score).slice(0,5),agents:snapshot.agents.map((a,i)=>({...a,load:i%3===0?'HIGH':i%3===1?'MEDIUM':'LOW'}))};
}
