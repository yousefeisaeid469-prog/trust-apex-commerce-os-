import {createReleaseCandidate} from '../modules/platform/production-reliability/candidate.ts';
import {executeCase} from '../modules/platform/reliability-lab/engine.ts';
import {InMemoryProgressiveDeliveryAdapter} from '../modules/platform/progressive-delivery/adapter.ts';
import {runProgressiveDelivery,DEFAULT_ROLLOUT_STAGES} from '../modules/platform/progressive-delivery/index.ts';
const candidate=createReleaseCandidate({version:'147.0.0',sourceFingerprint:'demo-source',migrationFingerprint:'demo-migration',policyRevision:'demo-policy',buildRef:'demo-build',createdAt:'2026-09-03T00:00:00.000Z'});
const healthy={availability:1,errorRate:0,p95Ms:10,budgetConsumedPct:0,replayMatches:true,newFailure:false,labResult:executeCase(1471,[{id:'1',kind:'OPEN'}],[])};
const observations=Object.fromEntries(DEFAULT_ROLLOUT_STAGES.map(p=>[p,healthy]));
const out=runProgressiveDelivery({deploymentId:'demo-v147',rolloutId:'demo-global-rollout',candidate,plan:{stages:DEFAULT_ROLLOUT_STAGES.map((percent,ordinal)=>({ordinal,percent,regions:['global'],observeWindowMs:30000})),maxBlastRadiusPct:100,rollbackBudgetPct:25,requireSequentialPromotion:true},observations},new InMemoryProgressiveDeliveryAdapter());
console.log(JSON.stringify({version:candidate.version,candidateHash:candidate.candidateHash,decision:out.decision,phase:out.phase,completedPercent:out.completedPercent,runtimeVerified:out.runtimeVerified,evidenceHash:out.evidenceHash},null,2));
