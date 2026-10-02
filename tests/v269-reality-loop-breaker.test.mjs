import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const reportPath = 'artifacts/reality/reality-loop-breaker-v269.json';
execFileSync(process.execPath, ['scripts/reality_loop_breaker.mjs'], {cwd:root, stdio:'pipe'});
const report = JSON.parse(fs.readFileSync(reportPath,'utf8'));
assert.equal(report.status, 'LOOP_BROKEN');
assert.equal(report.sourceCounts.historicalDocumentationClaims, 58);
assert.equal(report.sourceCounts.explicitlyPromotedWorkItems, 0);
assert.equal(report.outcome.legacy58ClaimsAreBacklog, false);
assert.equal(report.outcome.generatedAuditArtifactsAreImplementation, false);
assert.equal(report.outcome.nextReleaseMustImplementOrStop, true);
assert.equal(fs.existsSync('config/reality/current-work-items.json'), true);
assert.equal(fs.existsSync('scripts/reality_productivity_guard.mjs'), true);
console.log('V269 reality loop breaker test PASS');
