import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(pkg.version!=='417.0.0') throw new Error('V417_PACKAGE_VERSION_MISMATCH');
for(const f of ['scripts/v417_execution_graph_test.mjs','scripts/v417_execution_graph_audit.mjs','scripts/migration_check.mjs']) execFileSync(process.execPath,[path.join(root,f)],{cwd:root,stdio:'inherit'});
console.log('V417 RELEASE GATE PASS');
