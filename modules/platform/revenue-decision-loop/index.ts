import {estimateRevenueEconomics} from '../revenue-intelligence/index.ts';
import {evaluateRevenueExperiment} from '../revenue-experimentation/index.ts';
export function buildRevenueDecisionLoop(input:any){
 const experiments=new Map((input.experiments??[]).map((x:any)=>[x.programId,x]));
 const decisions=input.optimizationInputs.map((x:any)=>{const e=experiments.get(x.programId);const experimentDecision=e?evaluateRevenueExperiment(e).decision:undefined;return {programId:x.programId,experimentDecision,status:experimentDecision==='SCALE'?'SCALE_SIGNAL':experimentDecision==='INSUFFICIENT_EVIDENCE'?'EVIDENCE_GAP':'MONITOR',economics:estimateRevenueEconomics(x)};}).sort((a:any,b:any)=>Number(b.economics.contributionMinor-a.economics.contributionMinor));
 const total=decisions.reduce((s:any,x:any)=>s+x.economics.contributionMinor,0n);const covered=decisions.filter((x:any)=>x.experimentDecision!==undefined).length;
 return {version:'V220.0.0',decisions,learningCoveragePct:decisions.length?covered*100/decisions.length:0,totalModeledContributionMinor:total};
}
