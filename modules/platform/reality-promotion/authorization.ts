import crypto from 'node:crypto';

export const PROMOTION_SIGNATURE_ALGORITHM = 'ed25519' as const;
export type PromotionSignatureAlgorithm = typeof PROMOTION_SIGNATURE_ALGORITHM;

export type PromotionAuthorizationPayload = {
  decisionId: string;
  decisionHash: string;
  fromState: string;
  toState: string;
  actorId: string;
  keyId: string;
  rationale: string;
  attestationRoot: string;
  evidenceLeaf: string;
  authorizationNonce: string;
  signedAt: string;
  authorizationExpiresAt: string;
  commandId?: string;
};

const canonicalize = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`;
};

export function promotionAuthorizationMessage(payload: PromotionAuthorizationPayload): Buffer {
  return Buffer.from(canonicalize(payload), 'utf8');
}

export function promotionAuthorizationPayloadHash(payload: PromotionAuthorizationPayload): string {
  return crypto.createHash('sha256').update(promotionAuthorizationMessage(payload)).digest('hex');
}

export function verifyPromotionSignature(input: {
  algorithm: PromotionSignatureAlgorithm;
  publicKeyPem: string;
  signatureBase64: string;
  payload: PromotionAuthorizationPayload;
}): boolean {
  if (input.algorithm !== PROMOTION_SIGNATURE_ALGORITHM) throw new Error(`PROMOTION_SIGNATURE_ALGORITHM_UNSUPPORTED:${input.algorithm}`);
  try {
    return crypto.verify(null, promotionAuthorizationMessage(input.payload), input.publicKeyPem, Buffer.from(input.signatureBase64, 'base64'));
  } catch {
    return false;
  }
}

export function signPromotionPayload(privateKeyPem: string, payload: PromotionAuthorizationPayload): string {
  return crypto.sign(null, promotionAuthorizationMessage(payload), privateKeyPem).toString('base64');
}
