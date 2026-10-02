import fs from 'node:fs';import path from 'node:path';const root=process.cwd();
const must=['modules/platform/global-commerce-automation/decision-command-gateway.ts','db/migrations/210_v381_decision_command_gateway.sql','app/api/commerce/decision-fabric/commands/route.ts','app/global-commerce-decision-command-gateway/page.tsx'];
const bad=must.filter(x=>!fs.existsSync(path.join(root,x)));if(bad.length){console.error(`V381 DECISION COMMAND GATEWAY AUDIT FAILED (${bad.length})`);bad.forEach(x=>console.error('- '+x));process.exit(1)}
const s=fs.readFileSync(path.join(root,must[0]),'utf8');
for(const n of ['createDecisionCommand','approveDecisionCommand','executeDecisionCommand','ALLOWED_ACTIONS','getActiveGovernedPolicy','executeSafeIncidentAction','idempotencyKey','GOVERNED_POLICY_CHANGED'])if(!s.includes(n)){console.error('missing '+n);process.exit(1)}
const m=fs.readFileSync(path.join(root,must[1]),'utf8');
for(const n of ['trust_commerce_decision_commands','idempotency_key TEXT NOT NULL UNIQUE','APPROVED','EXECUTING','EXECUTED','trust_commerce_decision_command_approvals'])if(!m.includes(n)){console.error('migration missing '+n);process.exit(1)}
console.log('V381 DECISION COMMAND GATEWAY AUDIT PASS — 9/9');
