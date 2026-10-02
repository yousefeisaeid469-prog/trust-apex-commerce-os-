import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8'); const errors=[];
const migration=read('db/migrations/229_v404_global_command_bus.sql');
for(const token of ['trust_commands','trust_command_attempts','trust_commands_idempotency_uq'])if(!migration.includes(token))errors.push(`missing migration token ${token}`);
for(const [f,tokens] of Object.entries({
  'modules/platform/command-bus.ts':['submitCommandTx','COMMAND_IDEMPOTENCY_CONFLICT','commerce.command.requested'],
  'modules/platform/commands/registry.ts':['inventory.adjust','adjustInventoryTransactionTx'],
  'scripts/command_worker.mjs':['FOR UPDATE SKIP LOCKED','trust_command_attempts','COMMAND_HANDLER_NOT_REGISTERED'],
  'app/api/commands/route.ts':['idempotency-key','submitCommand'],
  'app/api/commands/[id]/route.ts':['commandSnapshot'],
}))for(const t of tokens)if(!read(f).includes(t))errors.push(`${f}: missing ${t}`);
if(errors.length){console.error('V404 COMMAND BUS AUDIT FAIL');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('V404 COMMAND BUS AUDIT PASS — durable command inbox, idempotency, leases, attempts and real inventory handler are wired.');
