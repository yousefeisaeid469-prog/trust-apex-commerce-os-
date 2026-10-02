import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const failures=[];
const must=[
 'modules/platform/global-commerce-automation/learning-policy.ts',
 'modules/platform/global-commerce-automation/core.ts',
 'db/migrations/207_v378_learning_policy_engine.sql',
 'app/api/commerce/automation/route.ts',
 'tests/v378-learning-policy.test.mjs'
];
for(const p of must) if(!fs.existsSync(path.join(root,p))) failures.push(`missing: ${p}`);
const core=fs.readFileSync(path.join(root,'modules/platform/global-commerce-automation/core.ts'),'utf8');
const lp=fs.readFileSync(path.join(root,'modules/platform/global-commerce-automation/learning-policy.ts'),'utf8');
for(const needle of ['getActivePolicy','getLearningEvidence','policyState','learningEvidence']) if(!core.includes(needle)) failures.push(`automation core missing ${needle}`);
for(const needle of ['MIN_VERIFIED_SAMPLES','promoteLearnedPolicy','pauseLearnedPolicy','POLICY_NOT_ELIGIBLE']) if(!lp.includes(needle)) failures.push(`learning policy missing ${needle}`);
const migration=fs.readFileSync(path.join(root,'db/migrations/207_v378_learning_policy_engine.sql'),'utf8');
for(const needle of ['trust_commerce_automation_policies','PROPOSED','ACTIVE','PAUSED']) if(!migration.includes(needle)) failures.push(`migration missing ${needle}`);
if(failures.length){console.error(`V378 LEARNING POLICY AUDIT FAILED (${failures.length})`); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1);}
console.log('V378 LEARNING POLICY AUDIT PASS — 5/5');
