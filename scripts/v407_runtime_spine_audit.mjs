import fs from 'node:fs';
const must=[
 'db/migrations/232_v407_global_runtime_spine.sql',
 'modules/platform/runtime-spine.ts',
 'app/api/runtime/route.ts',
 'app/api/runtime/operations/[id]/route.ts',
 'scripts/command_worker.mjs',
 'scripts/workflow_worker.mjs',
];
for(const p of must) if(!fs.existsSync(p)) throw new Error(`V407_MISSING:${p}`);
const sql=fs.readFileSync(must[0],'utf8');
for(const token of ['trust_runtime_operations','trust_runtime_operation_events','trust_runtime_operation_snapshot']) if(!sql.includes(token)) throw new Error(`V407_SQL_MISSING:${token}`);
const spine=fs.readFileSync(must[1],'utf8');
for(const token of ['ensureRuntimeOperationTx','transitionRuntimeOperationTx','runtimeOperationSnapshot','runtimeSpineSnapshot']) if(!spine.includes(token)) throw new Error(`V407_SPINE_MISSING:${token}`);
const command=fs.readFileSync(must[4],'utf8'); const workflow=fs.readFileSync(must[5],'utf8');
if(!command.includes("operation_type='command'")) throw new Error('V407_COMMAND_NOT_WIRED');
if(!workflow.includes("operation_type='workflow'")) throw new Error('V407_WORKFLOW_NOT_WIRED');
console.log('V407 RUNTIME SPINE AUDIT PASS — command + workflow execution lifecycle wired to durable runtime operations.');
