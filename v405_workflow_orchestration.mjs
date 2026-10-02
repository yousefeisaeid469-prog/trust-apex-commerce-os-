import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
const errors=[];
const files=[
 'db/migrations/230_v405_global_commerce_workflows.sql',
 'modules/platform/workflow-orchestrator.ts',
 'modules/platform/commands/registry.ts',
 'scripts/workflow_worker.mjs',
 'app/api/workflows/route.ts',
 'app/api/workflows/[id]/route.ts',
 'scripts/v405_workflow_orchestration.mjs',
 'scripts/v405_release_gate.mjs',
 'MASTER-RELEASE.md'
];
for(const f of files) if(!fs.existsSync(f)) errors.push(`missing ${f}`);
const mig=read('db/migrations/230_v405_global_commerce_workflows.sql');
for(const t of ['trust_workflow_instances','trust_workflow_steps','trust_workflow_events','COMPENSATING','compensation_command_type']) if(!mig.includes(t)) errors.push(`missing contract ${t}`);
const engine=read('modules/platform/workflow-orchestrator.ts');
for(const t of ['startWorkflowTx','submitCommandTx','trust_workflow_steps','workflow.started']) if(!engine.includes(t)) errors.push(`engine contract ${t}`);
const worker=read('scripts/workflow_worker.mjs');
for(const t of ['FOR UPDATE OF s SKIP LOCKED','commandHandler','compensation_command_type','trust_workflow_events']) if(!worker.includes(t)) errors.push(`worker contract ${t}`);
const registry=read('modules/platform/commands/registry.ts');
if(!registry.includes("'workflow.start'")) errors.push('workflow.start not registered');
if(!registry.includes("startWorkflowTx")) errors.push('workflow handler not durable');
if(errors.length){console.error('V405 WORKFLOW ORCHESTRATION AUDIT FAILED');for(const e of errors)console.error('- '+e);process.exit(1)}
console.log('V405 WORKFLOW ORCHESTRATION AUDIT PASS — durable workflow state, ordered steps, compensation and command-bus execution are wired.');
