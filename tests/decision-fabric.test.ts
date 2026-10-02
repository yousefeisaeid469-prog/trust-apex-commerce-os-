import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDecision, validateEvidence, evidenceContentHash } from '../modules/platform/decision-fabric/index.ts';

test('client claims cannot self-attest as verified', () => {
  const [e] = validateEvidence([{id:'e01',kind:'PRICE',status:'VERIFIED',source:'client',observedAt:new Date().toISOString(),confidence:1,claim:'trusted'}]);
  assert.equal(e.status,'UNVERIFIED');
  assert.ok(e.confidence <= .49);
  assert.equal(e.trustLevel,'UNVERIFIED');
});

test('client cannot self-assert system trust', () => {
  const [e] = validateEvidence([{id:'e04',kind:'PRICE',status:'VERIFIED',source:'client',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:new Date().toISOString(),confidence:.95,claim:'trusted'}]);
  assert.equal(e.status,'UNVERIFIED');
});

test('trusted ingress may preserve system evidence', () => {
  const [e] = validateEvidence([{id:'e04',kind:'PRICE',status:'VERIFIED',source:'system',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:new Date().toISOString(),confidence:.95,claim:'trusted'}], 'default', {trustedIngress:true});
  assert.equal(e.status,'VERIFIED');
  assert.equal(e.confidence,.95);
});

test('contradictions escalate and unknown stays explicit', () => {
  const decision=evaluateDecision({subjectId:'p1',action:'BUY',impact:'HIGH',evidence:[{id:'x',kind:'PRICE',status:'CONTRADICTED',source:'system',trustLevel:'SYSTEM',observedAt:new Date().toISOString(),confidence:.9,claim:'conflict'}]});
  assert.equal(decision.outcome,'BLOCK');
  assert.equal(decision.humanReviewRequired,true);
  assert.ok(decision.missingEvidence.includes('AUTHENTICITY'));
});

test('evidence hash is deterministic', () => {
  const evidence=[{id:'e03',kind:'PRICE' as const,status:'VERIFIED' as const,source:'system',trustLevel:'SYSTEM' as const,observedAt:'2026-01-01T00:00:00.000Z',confidence:.9,claim:'x'}];
  assert.equal(evidenceContentHash(evidence),evidenceContentHash([...evidence]));
});
