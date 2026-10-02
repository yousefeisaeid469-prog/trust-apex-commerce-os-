import {optimizeRevenuePortfolio} from '../modules/platform/revenue-intelligence/index.ts';
const inputs=[
 {programId:'marketplace-commission',observedEvents:100,eligibleUnits:120,averageChargeMinor:1500n,variableCostBps:800,demandScore:88,conversionScore:82,retentionScore:70,operationalScore:92,riskScore:18,evidenceCoverage:96},
 {programId:'sponsored-products',observedEvents:70,eligibleUnits:90,averageChargeMinor:900n,variableCostBps:2500,demandScore:92,conversionScore:74,retentionScore:55,operationalScore:88,riskScore:28,evidenceCoverage:91},
 {programId:'fba',observedEvents:80,eligibleUnits:95,averageChargeMinor:2500n,variableCostBps:7000,demandScore:79,conversionScore:77,retentionScore:82,operationalScore:68,riskScore:30,evidenceCoverage:94},
 {programId:'subscribe-save',observedEvents:55,eligibleUnits:70,averageChargeMinor:700n,variableCostBps:1800,demandScore:76,conversionScore:69,retentionScore:94,operationalScore:91,riskScore:15,evidenceCoverage:88}
];
const result=optimizeRevenuePortfolio(inputs,{baseRateBps:1500,eligibleUnits:100,averageBaseMinor:10000n,variableCostBps:800,elasticity:.7});
console.log(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v));
