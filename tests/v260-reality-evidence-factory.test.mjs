import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const expectedVersion = `V${pkg.version}`;
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const run = spawnSync(process.execPath, ['scripts/reality_evidence_factory.mjs'], {cwd: root, encoding:'utf8'});
if (run.status !== 0) throw new Error(run.stderr || run.stdout || 'factory failed');
const report = JSON.parse(read('artifacts/reality/reality-evidence-factory.json'));
if (report.version !== expectedVersion) throw new Error(`wrong version ${report.version}`);
if (report.counts.total !== 58) throw new Error('expected 58 packets');
if (report.counts.blockedPendingExplicitEvidence !== 58) throw new Error('all packets must remain blocked');
if (report.counts.eligible !== 0 || report.counts.executed !== 0 || report.counts.promotionAllowed !== 0) throw new Error('factory crossed the evidence safety boundary');
for (const p of report.packets) {
  if (p.execution.eligible) throw new Error(`packet unexpectedly eligible: ${p.id}`);
  for (const key of ['implementationArtifacts','runtimeMarkers','regressionTests']) {
    if (p.evidence[key].length !== 0) throw new Error(`authoritative ${key} must remain empty: ${p.id}`);
  }
  if (!p.discoveryOnly || (!Array.isArray(p.discoveryOnly.candidateArtifacts) && !Array.isArray(p.discoveryOnly.candidateRuntimeMarkers))) throw new Error(`missing discovery boundary: ${p.id}`);
}
console.log('V260 Reality Evidence Execution Factory PASS — 58/58 packets blocked safely; 0 executed; 0 promoted.');
