import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(pkg.version!=='416.0.0') throw new Error('V416_PACKAGE_VERSION_MISMATCH');
for(const f of ['scripts/v416_canonical_execution_test.mjs','scripts/v416_canonical_execution_audit.mjs','scripts/migration_check.mjs']) execFileSync(process.execPath,[path.join(root,f)],{cwd:root,stdio:'inherit'});
console.log('V416 RELEASE GATE PASS');
