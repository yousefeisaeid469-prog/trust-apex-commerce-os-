import fs from 'node:fs';
const required=[
  ['db/migrations/234_v409_production_failure_closure.sql',/trust_commerce_recovery_cases/],
  ['db/migrations/234_v409_production_failure_closure.sql',/trust_commerce_recovery_attempts/],
  ['db/migrations/234_v409_production_failure_closure.sql',/trust_commerce_recovery_snapshot/],
  ['modules/commerce/core/recovery-closure.ts',/recordCommerceFailureTx/],
  ['modules/commerce/core/recovery-closure.ts',/resolveCommerceRecoveryTx/],
  ['modules/commerce/core/execution-worker.ts',/recordCommerceFailureTx/],
  ['modules/commerce/core/execution-worker.ts',/resolveCommerceRecoveryTx/],
  ['app/api/runtime/recovery/route.ts',/recoverySnapshot/],
];
for(const [file,pattern] of required){if(!fs.existsSync(file))throw new Error(`V409_REQUIRED_FILE_MISSING:${file}`);if(!pattern.test(fs.readFileSync(file,'utf8')))throw new Error(`V409_REQUIRED_PATTERN_MISSING:${file}:${pattern}`);}
console.log('V409 FAILURE CLOSURE AUDIT PASS');
