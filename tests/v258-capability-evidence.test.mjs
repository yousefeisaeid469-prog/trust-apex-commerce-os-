import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const a = JSON.parse(fs.readFileSync('artifacts/reality/reality-capability-evidence-resolution.json','utf8'));
if (a.version !== `V${pkg.version}`) throw new Error(`version=${a.version}`);
if (a.counts.total !== 58) throw new Error(`total=${a.counts.total}`);
if (a.counts.promotionAllowed !== 0) throw new Error(`promotionAllowed=${a.counts.promotionAllowed}`);
if (a.records.some(r => r.promotionAllowed !== false)) throw new Error('record promotion flag escaped');
if (a.records.some(r => r.status === 'REQUIRES_EXECUTION' && (!r.authoritativeEvidence.implementationArtifacts.length || !r.authoritativeEvidence.runtimeMarkers.length || !r.authoritativeEvidence.regressionTests.length))) throw new Error('invalid execution-ready contract');
console.log(`V258 capability evidence resolver regression PASS — ${a.counts.total} contracts; ${a.counts.PARTIAL ?? 0} partial; ${a.counts.BLOCKED ?? 0} blocked; 0 promoted.`);
