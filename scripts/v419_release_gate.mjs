import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
execFileSync('node',['--experimental-strip-types','scripts/v419_state_reconciliation_test.mjs'],{stdio:'inherit'});
execFileSync('node',['scripts/v419_state_reconciliation_audit.mjs'],{stdio:'inherit'});
execFileSync('node',['scripts/migration_check.mjs'],{stdio:'inherit'});
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); if(pkg.version!=='419.0.0')throw new Error('V419_VERSION_DRIFT');
console.log('V419 RELEASE GATE PASS');
