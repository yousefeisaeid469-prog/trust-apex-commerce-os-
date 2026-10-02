import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const ledgerPath = 'config/reality/release-claims-v248.json';
const ledger = JSON.parse(read(ledgerPath));
const failures = [];
const seen = new Set();

if (ledger.version !== 'V248.0.0') failures.push(`LEDGER_VERSION_MISMATCH:${ledger.version}`);
if (!Array.isArray(ledger.claims) || ledger.claims.length === 0) failures.push('EMPTY_CLAIM_LEDGER');

for (const claim of ledger.claims ?? []) {
  if (!claim.id || seen.has(claim.id)) failures.push(`DUPLICATE_OR_MISSING_CLAIM_ID:${claim.id ?? '<missing>'}`);
  seen.add(claim.id);
  for (const file of claim.artifacts ?? []) if (!exists(file)) failures.push(`${claim.id}:MISSING_ARTIFACT:${file}`);
  for (const marker of claim.markers ?? []) {
    const matched = (claim.artifacts ?? []).some(file => exists(file) && read(file).includes(marker));
    if (!matched) failures.push(`${claim.id}:MISSING_RUNTIME_MARKER:${marker}`);
  }
  for (const test of claim.tests ?? []) if (!exists(test)) failures.push(`${claim.id}:MISSING_TEST:${test}`);
  if (!claim.artifacts?.length || !claim.markers?.length || !claim.tests?.length) failures.push(`${claim.id}:INCOMPLETE_EVIDENCE_CHAIN`);
}

if (failures.length) {
  console.error(`Reality claim audit FAILED (${failures.length})`);
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  version: ledger.version,
  claims: ledger.claims.length,
  rule: ledger.policy,
  evidence: 'implementation + runtime marker + regression test'
}, null, 2));
