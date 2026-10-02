import fs from 'node:fs';
import assert from 'node:assert/strict';

const route = fs.readFileSync('app/api/cron/commerce-execution-worker/route.ts','utf8');
const vercel = JSON.parse(fs.readFileSync('vercel.json','utf8'));
const version = fs.readFileSync('lib/runtime/version.ts','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const changelog = fs.readFileSync('CHANGELOG-V358.md','utf8');

assert.equal(vercel.crons?.length, 1);
assert.equal(vercel.crons[0].path, '/api/cron/commerce-execution-worker');
assert.equal(vercel.crons[0].schedule, '0 3 * * *');
assert.notEqual(vercel.crons[0].schedule, '* * * * *');
assert.match(route, /CRON_SECRET/);
assert.match(route, /Bearer \$\{configured\}/);
assert.match(route, /runCommerceExecutionWorker/);
assert.match(route, /recoverExpiredCommerceExecutionLeases/);
assert.match(route, /TRUST_COMMERCE_CRON_BATCH/);
assert.match(version, /V359\.0\.0/);
assert.equal(pkg.version, '359.0.0');
assert.equal(lock.packages[''].version, '359.0.0');
assert.match(changelog, /Hobby/);
assert.match(changelog, /once per day/i);
assert.match(changelog, /standalone process/);
console.log('V358 Hobby-safe Vercel Cron: PASS');
