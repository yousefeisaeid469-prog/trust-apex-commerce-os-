import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const failures=[];
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='417.0.0') failures.push('package.version');
if(!read('lib/runtime/version.ts').includes("RUNTIME_VERSION='417.0.0'")) failures.push('runtime.version');
for(const f of ['modules/commerce/core/execution-graph.ts','db/migrations/242_v417_commerce_execution_graph.sql','scripts/v417_execution_graph_test.mjs','app/api/commerce/execution-graph/[id]/route.ts']) if(!fs.existsSync(path.join(root,f))) failures.push(`missing:${f}`);
for(const f of ['modules/commerce/payments/orchestrator.ts','modules/platform/fulfillment-tracking-3/core.ts']) if(!read(f).includes('refreshCommerceExecutionGraphTx')) failures.push(`missing graph sync:${f}`);
if(failures.length){console.error('V417 EXECUTION GRAPH AUDIT FAIL',failures);process.exit(1)}
console.log('V417 EXECUTION GRAPH AUDIT PASS');
