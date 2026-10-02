import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

const resolution = JSON.parse(read('artifacts/reality/reality-claim-resolution.json'));
const policy = JSON.parse(read('config/reality/reality-loop-breaker-v269.json'));

function classify(record) {
  const source = String(record.id ?? '');
  if (record.classification === 'CAPABILITY_CLAIM' && (source.startsWith('draft-doc:docs/releases/') || source.startsWith('draft-doc:docs/architecture/'))) {
    return 'HISTORICAL_DOCUMENTATION_CLAIM';
  }
  if (record.classification === 'CAPABILITY_CLAIM') return 'EXPLICIT_CAPABILITY_CLAIM_REQUIRES_WORK_ITEM';
  return 'NON_CAPABILITY_RECORD';
}

const records = (resolution.records ?? []).map(r => ({
  id: r.id,
  claim: r.claim,
  source: String(r.id ?? '').replace(/^draft-doc:/, ''),
  classification: classify(r),
  actionable: classify(r) === 'EXPLICIT_CAPABILITY_CLAIM_REQUIRES_WORK_ITEM'
}));

const historical = records.filter(r => r.classification === 'HISTORICAL_DOCUMENTATION_CLAIM');
const actionable = records.filter(r => r.actionable);

// A claim becomes a real work item only when the current project explicitly names it.
// The old V257-V268 pipeline did the opposite: it converted historical docs into 58
// capability shells, then kept producing tooling around those shells.
const currentWorkManifest = exists('config/reality/current-work-items.json')
  ? JSON.parse(read('config/reality/current-work-items.json'))
  : { version: 'V269.0.0', workItems: [] };

const promotedIds = new Set((currentWorkManifest.workItems ?? []).map(x => x.sourceClaimId).filter(Boolean));
const trueWorkItems = actionable.filter(r => promotedIds.has(r.id));

const report = {
  version: 'V269.0.0',
  status: 'LOOP_BROKEN',
  policy,
  sourceCounts: {
    capabilityRecords: records.filter(r => r.classification !== 'NON_CAPABILITY_RECORD').length,
    historicalDocumentationClaims: historical.length,
    explicitCapabilityClaims: actionable.length,
    explicitlyPromotedWorkItems: trueWorkItems.length
  },
  outcome: {
    legacy58ClaimsAreBacklog: false,
    generatedAuditArtifactsAreImplementation: false,
    nextReleaseMustImplementOrStop: true
  },
  rule: 'Historical release/architecture claims are not an implementation backlog. Only explicit current work items may enter implementation execution.',
  historicalClaims: historical.map(r => ({ id: r.id, source: r.source, claim: r.claim })),
  promotedWorkItems: trueWorkItems.map(r => ({ id: r.id, source: r.source, claim: r.claim }))
};

fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-loop-breaker-v269.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-loop-breaker-v269.md'), [
  '# TRUST V269 — Reality Loop Breaker', '',
  '## Finding',
  `The prior evidence pipeline classified ${historical.length} historical documentation claims as capability work that still needed evidence.`,
  'That classification created a self-referential loop: audit artifacts became discovery candidates for the next audit.', '',
  '## Corrected model',
  '- Historical release/architecture claims are records of what a release said, not a request to rebuild it.',
  '- Generated evidence, audit, receipt, promotion and governance files can never become implementation candidates.',
  '- A capability becomes actionable only through an explicit current work-item manifest.',
  '- If a release has no productive-surface change, the productivity guard fails instead of authoring another audit layer.', '',
  '## V269 result',
  `- Historical documentation claims: ${historical.length}`,
  `- Explicit current capability claims: ${actionable.length}`,
  `- Explicitly promoted work items: ${trueWorkItems.length}`,
  '- Automatic claim-to-work-item conversion: disabled',
  '- Automatic promotion: disabled',
  '- Audit-only release without productive change: fail', '',
  '## Next-action contract',
  '1. Choose an actual product/runtime capability.',
  '2. Add or modify production code/API/page/database boundary.',
  '3. Add an executable regression test.',
  '4. Run the relevant verification.',
  '5. If no implementation target exists, stop and tell the user instead of creating another evidence layer.'
].join('\n') + '\n');

if (historical.length !== 58) throw new Error(`Expected 58 historical documentation capability records, found ${historical.length}`);
if (trueWorkItems.length !== 0) throw new Error('V269 baseline must not silently promote historical claims into work items');
console.log(`Reality Loop Breaker PASS — ${historical.length} historical claims quarantined; ${trueWorkItems.length} promoted work items; automatic claim-to-work-item conversion disabled.`);
