import {executeCase} from '../modules/platform/reliability-lab/engine.ts';
import {createReleaseCandidate} from '../modules/platform/production-reliability/candidate.ts';
import {InMemoryDeploymentAdapter} from '../modules/platform/deployment-autopilot/adapter.ts';
import {runDeploymentAutopilot} from '../modules/platform/deployment-autopilot/controller.ts';
const candidate=createReleaseCandidate({version:'146.0.0',sourceFingerprint:'demo-source',migrationFingerprint:'demo-migration',policyRevision:'demo-policy',buildRef:'demo-build',createdAt:'2026-09-03T00:00:00.000Z'});
const lab=executeCase(1469,[{id:'1',kind:'OPEN'}],[]);
const out=runDeploymentAutopilot({deploymentId:'demo-v146',rolloutId:'demo-rollout',candidate,canary:{availability:1,errorRate:0,p95Ms:10,budgetConsumedPct:0,replayMatches:true,newFailure:false,labResult:lab}},new InMemoryDeploymentAdapter());
console.log(JSON.stringify({version:candidate.version,candidateHash:candidate.candidateHash,decision:out.decision,phase:out.phase,runtimeVerified:out.runtimeVerified,evidenceHash:out.evidenceHash},null,2));
