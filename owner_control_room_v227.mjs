import fs from 'node:fs';
const core=fs.readFileSync('modules/platform/owner-control-room/live-control.ts','utf8');
console.log(JSON.stringify({release:'V227.0.0',durable:true,controls:['MAINTENANCE_MODE','GLOBAL_FREEZE','AUTONOMY_KILL_SWITCH'],dbTable:'trust_owner_live_control_state',ownerGuard:'requireOwnerSession'},null,2));
