import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['--experimental-strip-types','tests/v317-transactional-marketplace.test.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/v317_audit.mjs'],{stdio:'inherit'});
console.log('V317 verification suite PASS — transactional marketplace execution contracts verified.');
