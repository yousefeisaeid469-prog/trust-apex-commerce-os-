import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('artifacts/reality/reality-evidence-promotion.json', 'utf8'));
if (!/^V\d+\.0\.0$/.test(p.version)) throw new Error(`wrong promotion version: ${p.version}`);
if (p.counts.structuredClaims !== 8) throw new Error(`expected 8 structured claims, got ${p.counts.structuredClaims}`);
if (p.counts.readyForPromotion !== 8) throw new Error(`expected all 8 structured claims ready, got ${p.counts.readyForPromotion}`);
if (p.documentationOnlyQueue.some(x => x.status !== 'BLOCKED_NO_STRUCTURED_CLAIM')) throw new Error('documentation-only record was incorrectly promoted');
for (const x of p.promotions) {
  if (x.status === 'READY_FOR_PROMOTION' && !(x.gate.implementation && x.gate.runtimeMarkers && x.gate.regressionTests)) throw new Error(`incomplete promoted claim: ${x.id}`);
}
console.log(`V253 reality evidence promotion test PASS — ${p.counts.readyForPromotion} structured claims eligible; ${p.counts.documentationOnlyQueue} docs-only records remain blocked from inference.`);
