import {buildGlobalReliabilityReport} from '../modules/platform/global-reliability/core.ts';
const report=buildGlobalReliabilityReport({regions:[{region:'primary',state:'UNKNOWN',trafficPct:100,capacityPct:60,errorRate:0,latencyP95Ms:0}],objectives:[{service:'commerce-core',rtoMinutes:30,rpoMinutes:15,evidenceStatus:'MISSING'}]});
console.log(JSON.stringify({version:report.version,ready:report.ready,score:report.score,plans:report.plans.length,blockers:report.blockers.length},null,2));
