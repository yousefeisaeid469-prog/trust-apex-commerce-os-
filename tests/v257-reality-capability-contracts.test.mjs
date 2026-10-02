import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('artifacts/reality/reality-capability-contracts.json','utf8'));
if (!/^V\d+\.0\.0$/.test(a.version)) throw new Error(`invalid version=${a.version}`);
if (a.schemaVersion !== '1.0') throw new Error(`schemaVersion=${a.schemaVersion}`);
if (a.counts.inputCapabilityClaims !== 58) throw new Error(`input=${a.counts.inputCapabilityClaims}`);
if (a.counts.compiledContracts !== 58) throw new Error(`compiled=${a.counts.compiledContracts}`);
if (a.counts.readyForExecution !== 0) throw new Error(`ready=${a.counts.readyForExecution}`);
if (a.counts.blockedPendingAuthoring !== 58) throw new Error(`blocked=${a.counts.blockedPendingAuthoring}`);
const ids = new Set();
for (const c of a.contracts) {
  if (ids.has(c.id)) throw new Error(`duplicate=${c.id}`);
  ids.add(c.id);
  if (c.lifecycle !== 'DRAFT') throw new Error(`lifecycle=${c.id}`);
  if (c.evidenceContract.implementationArtifacts.length !== 0) throw new Error(`auto implementation=${c.id}`);
  if (c.evidenceContract.runtimeMarkers.length !== 0) throw new Error(`auto marker=${c.id}`);
  if (c.evidenceContract.regressionTests.length !== 0) throw new Error(`auto test=${c.id}`);
  if (c.evidenceContract.failureCondition !== 'BLOCKED_UNTIL_EXPLICIT_EVIDENCE') throw new Error(`failure policy=${c.id}`);
}
console.log('V257 capability contract compiler PASS — 58 explicit contract shells; zero inferred evidence or auto-promotion.');
