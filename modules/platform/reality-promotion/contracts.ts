export const PROMOTION_STATES = ['PENDING_EXPLICIT_REVIEW','APPROVED','REJECTED','PROMOTED','REVOKED'] as const;
export type PromotionState = typeof PROMOTION_STATES[number];

export type PromotionDecision = {
  decisionId: string;
  capabilityId: string;
  state: PromotionState;
  attestationRoot: string;
  evidenceLeaf: string;
  baselineEvidenceDigest: string;
  decisionHash: string;
  reviewerId: string | null;
  rationale: string;
};

export const ALLOWED_TRANSITIONS: Record<PromotionState, readonly PromotionState[]> = {
  PENDING_EXPLICIT_REVIEW: ['APPROVED','REJECTED'],
  APPROVED: ['PROMOTED','REVOKED'],
  REJECTED: [],
  PROMOTED: ['REVOKED'],
  REVOKED: [],
};

export function assertTransition(from: PromotionState, to: PromotionState) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) throw new Error(`PROMOTION_TRANSITION_FORBIDDEN:${from}->${to}`);
}

export function assertEvidenceBinding(decision: Pick<PromotionDecision,'attestationRoot'|'evidenceLeaf'|'baselineEvidenceDigest'>, evidence: Pick<PromotionDecision,'attestationRoot'|'evidenceLeaf'|'baselineEvidenceDigest'>) {
  if (decision.attestationRoot !== evidence.attestationRoot || decision.evidenceLeaf !== evidence.evidenceLeaf || decision.baselineEvidenceDigest !== evidence.baselineEvidenceDigest) {
    throw new Error('PROMOTION_EVIDENCE_BINDING_MISMATCH');
  }
}
