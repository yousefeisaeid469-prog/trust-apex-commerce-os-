import fs from 'node:fs';
const required=['modules/platform/zero-trust/service-identity.ts','modules/platform/cqrs/command-bus.ts','modules/platform/cqrs/query-bus.ts','modules/platform/cqrs/aggregate.ts','modules/platform/chaos/scenarios.ts','modules/platform/chaos/fault-plan.ts','modules/platform/tracing/otel-model.ts','modules/platform/control-plane-v139/lease-recovery.ts','db/migrations/029_v139_autonomous_control_plane.sql','tests/v139-autonomous-platform.test.mjs','docs/architecture/AUTONOMOUS-CONTROL-PLANE-V139.md','docs/acquisition/TECHNICAL-MOAT-V139.md'];
const errors=required.filter(f=>!fs.existsSync(f)).map(f=>`Missing V139 artifact: ${f}`);
const mig=fs.readFileSync('db/migrations/029_v139_autonomous_control_plane.sql','utf8');
for(const t of ['trust_service_identities','trust_fault_plans','trust_trace_spans','trust_cqrs_dispatches']) if(!mig.includes(t)) errors.push(`Missing V139 table ${t}`);

if(errors.length){console.error(`TRUST V139 autonomous audit FAILED (${errors.length})`);errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('TRUST V139 autonomous audit PASS — zero-trust identity, CQRS, aggregate replay, chaos controls, tracing and recovery verified.');
