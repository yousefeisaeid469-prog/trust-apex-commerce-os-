import { execFileSync } from 'node:child_process';
execFileSync(process.execPath,['--experimental-strip-types','tests/v316-marketplace-os.test.mjs'],{stdio:'inherit'});
console.log('V316 verification suite PASS — marketplace vertical slice contract, economics and stage transitions verified.');
