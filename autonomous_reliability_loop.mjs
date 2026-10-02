import {runAutonomousReliabilityLoop} from '../modules/platform/autonomous-reliability-loop/loop.ts';
import {InMemoryRuntimeEnforcer} from '../modules/platform/autonomous-reliability-loop/enforcer.ts';
import {executeCase} from '../modules/platform/reliability-lab/engine.ts';
import {TRUST_VERSION} from '../lib/runtime/version.ts';
const result=executeCase(144144,[{id:'op-1',kind:'OPEN'},{id:'op-2',kind:'PROCESS'}],[{at:0,kind:'THROW',operationId:'op-1'}]);
const out=runAutonomousReliabilityLoop({incidentId:'inc-v144-demo',signal:{serviceId:'checkout',tenantId:'tenant-demo',availability:0.8,errorRate:0.2,p95Ms:900,budgetConsumedPct:100,replayMatches:false,newFailure:true},result,rolloutId:'rollout-demo',blastRadius:{serviceIds:['checkout'],tenantIds:['tenant-demo'],rolloutIds:['rollout-demo']}},new InMemoryRuntimeEnforcer());
console.log(JSON.stringify({version:TRUST_VERSION,...out},null,2));
