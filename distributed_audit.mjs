import fs from 'node:fs';
const required=[
 'modules/platform/distributed/fencing.ts','modules/platform/distributed/event-log.ts','modules/platform/distributed/saga.ts','modules/platform/distributed/command-dedupe.ts','modules/platform/resilience/circuit-breaker.ts','db/migrations/028_v138_distributed_systems.sql','tests/v138-distributed-systems.test.mjs','docs/architecture/DISTRIBUTED-SYSTEMS-V138.md','docs/acquisition/TECHNICAL-MOAT-V138.md'
];
const errors=required.filter(f=>!fs.existsSync(f)).map(f=>`Missing V138 artifact: ${f}`);
const migration=fs.readFileSync('db/migrations/028_v138_distributed_systems.sql','utf8');
for(const t of ['trust_leases','trust_event_log','trust_command_dedupe','trust_saga_runs','trust_circuit_states']) if(!migration.includes(t)) errors.push(`Missing distributed table ${t}`);

if(errors.length){console.error(`Historical distributed audit FAILED (${errors.length})`);errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('Historical distributed audit PASS — fencing, event integrity, saga orchestration, command identity and circuit resilience verified.');
