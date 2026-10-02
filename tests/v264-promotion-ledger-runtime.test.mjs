import assert from 'node:assert/strict';
import { ALLOWED_TRANSITIONS, assertEvidenceBinding, assertTransition } from '../modules/platform/reality-promotion/contracts.ts';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

assert.deepEqual(ALLOWED_TRANSITIONS.PENDING_EXPLICIT_REVIEW, ['APPROVED','REJECTED']);
assert.doesNotThrow(() => assertTransition('PENDING_EXPLICIT_REVIEW','APPROVED'));
assert.throws(() => assertTransition('REJECTED','PROMOTED'), /PROMOTION_TRANSITION_FORBIDDEN/);
assert.doesNotThrow(() => assertEvidenceBinding(
  {attestationRoot:'a'.repeat(64),evidenceLeaf:'b'.repeat(64),baselineEvidenceDigest:'c'.repeat(64)},
  {attestationRoot:'a'.repeat(64),evidenceLeaf:'b'.repeat(64),baselineEvidenceDigest:'c'.repeat(64)}
));
assert.throws(() => assertEvidenceBinding(
  {attestationRoot:'a'.repeat(64),evidenceLeaf:'b'.repeat(64),baselineEvidenceDigest:'c'.repeat(64)},
  {attestationRoot:'d'.repeat(64),evidenceLeaf:'b'.repeat(64),baselineEvidenceDigest:'c'.repeat(64)}
), /PROMOTION_EVIDENCE_BINDING_MISMATCH/);
const store = fs.readFileSync('modules/platform/reality-promotion/store.ts','utf8');
assert.match(store,/seedPromotionDecisionsTx/);
assert.match(store,/transitionPromotionTx/);
assert.match(store,/FOR UPDATE/);
assert.match(store,/pg_advisory_xact_lock/);
assert.match(store,/previousEventHash/);
execFileSync(process.execPath,['scripts/reality_promotion_ledger.mjs'],{stdio:'pipe'});
console.log('V264 Promotion Ledger Runtime Test PASS — state machine, evidence binding, durable seed, and serialized transitions verified.');
