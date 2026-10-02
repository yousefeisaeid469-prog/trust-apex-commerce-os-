import fs from 'node:fs';
const core=fs.readFileSync('modules/platform/owner-control-room/core.ts','utf8');
const controls=(core.match(/\{id:'/g)||[]).length;
const highImpact=(core.match(/requiresApproval:true/g)||[]).length;
console.log(JSON.stringify({release:'V226.0.0',ownerAllowlist:'TRUST_OWNER_EMAILS',controls,highImpact},null,2));
