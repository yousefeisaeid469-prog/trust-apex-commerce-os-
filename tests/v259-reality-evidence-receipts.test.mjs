import fs from 'node:fs';
import crypto from 'node:crypto';
const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const a = JSON.parse(fs.readFileSync('artifacts/reality/reality-evidence-receipts.json','utf8'));
if (a.version !== `V${pkg.version}`) throw new Error(`version=${a.version}`);
if (a.counts.receipts !== 8 || a.counts.valid !== 8 || a.counts.blocked !== 0) throw new Error(`counts=${JSON.stringify(a.counts)}`);
if (a.counts.promotionAllowed !== 0 || a.receipts.some(r => r.promotionAllowed !== false)) throw new Error('receipt promotion escaped');
for (const r of a.receipts) {
  if (r.status !== 'EVIDENCE_RECEIPT_VALID') throw new Error(`${r.id} not valid`);
  for (const artifact of r.artifacts) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(artifact.file)).digest('hex');
    if (digest !== artifact.sha256) throw new Error(`${r.id}: digest mismatch ${artifact.file}`);
  }
  if (r.markers.some(m => !m.foundIn.length)) throw new Error(`${r.id}: missing marker`);
  if (r.tests.some(t => t.exitCode !== 0)) throw new Error(`${r.id}: test failed`);
}
console.log(`Evidence receipts regression PASS — ${a.counts.valid}/${a.counts.receipts} valid and integrity-checked.`);
