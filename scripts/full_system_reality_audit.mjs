import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const ledger = JSON.parse(read('config/reality/release-claims-v248.json'));

const statuses = ['PROVEN', 'PARTIAL', 'DOCUMENTED_ONLY', 'UNWIRED', 'STALE', 'CONTRADICTED'];
const results = [];
const failures = [];
const docs = [
  'MASTER-RELEASE.md',
  ...fs.readdirSync(path.join(root, 'docs/releases')).filter(f => /^MASTER-RELEASE-V\d+\.md$/.test(f) || /^V\d+-.*\.md$/.test(f)).map(f => `docs/releases/${f}`),
  ...fs.readdirSync(path.join(root, 'docs/architecture')).filter(f => /^.*V(138|139|140|141|142|143|144|145|146|147|148|149|150|233|234|235|236|237|238|240|241|242|243|244|245|246|247|248)\b.*\.md$/.test(f)).map(f => `docs/architecture/${f}`)
];

const docTexts = docs.filter(exists).map(file => ({ file, text: read(file) }));
const current = `V${pkg.version}`;

function evidence(claim) {
  const artifactOk = (claim.artifacts ?? []).every(exists);
  const testOk = (claim.tests ?? []).every(exists);
  const markerOk = (claim.markers ?? []).every(marker => (claim.artifacts ?? []).some(file => exists(file) && read(file).includes(marker)));
  return { artifactOk, testOk, markerOk };
}

for (const claim of ledger.claims ?? []) {
  const e = evidence(claim);
  let status = 'PROVEN';
  const negativeMarkers = ['NOT_WIRED', 'NOT_IMPLEMENTED', 'TODO', 'UNWIRED', 'DOCUMENTATION_ONLY', 'PROVIDER_REQUIRED'];
  const negativeEvidence = (claim.artifacts ?? []).some(file => exists(file) && negativeMarkers.some(m => read(file).includes(m)));
  if (negativeEvidence) status = 'CONTRADICTED';
  else if (!e.artifactOk && e.testOk) status = 'PARTIAL';
  else if (!e.artifactOk || !e.testOk) status = 'DOCUMENTED_ONLY';
  else if (!e.markerOk) status = 'UNWIRED';

  const versionHint = String(claim.id).match(/v(\d+)/i)?.[1];
  const referencedDocs = docTexts.filter(d => {
    const byId = versionHint && new RegExp(`(?:V|v)${versionHint}(?:\\.0\\.0)?\\b`).test(d.file + ' ' + d.text);
    const byClaim = d.text.toLowerCase().includes(String(claim.claim).toLowerCase().slice(0, 28));
    return byId || byClaim;
  }).map(d => d.file);
  if (status === 'PROVEN' && referencedDocs.length === 0) status = 'STALE';
  results.push({ id: claim.id, status, artifacts: claim.artifacts ?? [], tests: claim.tests ?? [], referencedDocs });
}

// Detect documentation claims that have no corresponding ledger entry. This is intentionally conservative.
const claimWords = /\b(implemented|supports?|provides?|guarantees?|production(?:-ready| ready)?|runtime-driven|durable|idempotent|bounded retries|aggregate ordering|poison-event|contract version|real provider|cell-aware|fail(?:s|ure)? closed)\b/i;
for (const { file, text } of docTexts) {
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!claimWords.test(line) || line.trim().startsWith('<!--')) return;
    const normalized = line.replace(/[`*_#>-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalized.length < 28) return;
    const alreadyCovered = results.some(r => r.referencedDocs.includes(file));
    if (!alreadyCovered) results.push({ id: `doc:${file}:${index + 1}`, status: 'DOCUMENTED_ONLY', artifacts: [], tests: [], referencedDocs: [file], line: index + 1, text: normalized.slice(0, 240) });
  });
}

const counts = Object.fromEntries(statuses.map(s => [s, results.filter(r => r.status === s).length]));
const strict = process.env.TRUST_REALITY_STRICT === '1';
const blocking = results.filter(r => ['UNWIRED', 'CONTRADICTED'].includes(r.status));
if (strict && blocking.length) failures.push(...blocking.map(r => `${r.id}:${r.status}`));

const report = {
  version: current,
  generatedAt: new Date().toISOString(),
  sourceLedger: 'config/reality/release-claims-v248.json',
  statusDefinitions: {
    PROVEN: 'Implementation, runtime evidence markers, and regression tests are present; documentation references the claim.',
    PARTIAL: 'Some executable evidence is present, but the evidence chain is incomplete.',
    DOCUMENTED_ONLY: 'The claim is visible in documentation without a complete executable evidence chain.',
    UNWIRED: 'Artifacts exist but the declared runtime markers are not wired into them.',
    STALE: 'The executable evidence exists but no current release documentation references the claim.',
    CONTRADICTED: 'Evidence contains explicit not-wired/not-implemented or equivalent negative runtime markers.'
  },
  counts,
  strictMode: strict,
  results
};
fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/full-system-reality-report.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/full-system-reality-report.md'), [
  `# TRUST ${current} — Full-System Reality Report`,
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## Status counts',
  ...statuses.map(s => `- ${s}: ${counts[s]}`),
  '',
  '## Results',
  ...results.map(r => `- **${r.status}** — ${r.id}${r.line ? ` (docs line ${r.line})` : ''}${r.text ? ` — ${r.text}` : ''}`),
  '',
  'Strict mode only blocks on UNWIRED and CONTRADICTED. DOCUMENTED_ONLY and STALE remain visible for remediation planning.'
].join('\n') + '\n');

if (failures.length) {
  console.error(`Full-system reality audit FAILED (${failures.length})`);
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log(`Full-system reality audit PASS — ${results.length} claim/document records; ${counts.PROVEN} proven, ${counts.PARTIAL} partial, ${counts.DOCUMENTED_ONLY} documented-only, ${counts.UNWIRED} unwired, ${counts.STALE} stale, ${counts.CONTRADICTED} contradicted.`);
