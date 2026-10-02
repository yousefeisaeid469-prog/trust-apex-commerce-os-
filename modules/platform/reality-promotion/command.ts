import crypto from 'node:crypto';
import type { PromotionState } from './contracts.ts';

export const PROMOTION_COMMAND_VERSION = 'V268';
export const PROMOTION_COMMAND_TYPES = ['APPROVE','REJECT','PROMOTE','REVOKE'] as const;
export type PromotionCommandType = typeof PROMOTION_COMMAND_TYPES[number];
export type PromotionCommandStatus = 'RECEIVED' | 'APPLIED';

const TARGETS: Record<PromotionCommandType, PromotionState> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  PROMOTE: 'PROMOTED',
  REVOKE: 'REVOKED',
};

export type PromotionCommand = {
  commandId: string;
  commandType: PromotionCommandType;
  decisionId: string;
  actorId: string;
  keyId: string;
  rationale: string;
  attestationRoot: string;
  evidenceLeaf: string;
  authorizationNonce: string;
  signedAt: string;
  authorizationExpiresAt: string;
};

const canonicalize = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
};

export function commandTargetState(type: PromotionCommandType): PromotionState { return TARGETS[type]; }

export function assertPromotionCommand(input: PromotionCommand): void {
  if (!input.commandId.trim() || !input.decisionId.trim() || !input.actorId.trim() || !input.keyId.trim()) throw new Error('PROMOTION_COMMAND_IDENTITY_REQUIRED');
  if (!PROMOTION_COMMAND_TYPES.includes(input.commandType)) throw new Error('PROMOTION_COMMAND_TYPE_UNSUPPORTED');
  if (!input.rationale.trim()) throw new Error('PROMOTION_COMMAND_RATIONALE_REQUIRED');
  if (!/^[a-f0-9]{64}$/.test(input.attestationRoot) || !/^[a-f0-9]{64}$/.test(input.evidenceLeaf)) throw new Error('PROMOTION_COMMAND_EVIDENCE_DIGEST_INVALID');
  if (!input.authorizationNonce.trim()) throw new Error('PROMOTION_COMMAND_NONCE_REQUIRED');
}

export function canonicalPromotionCommand(input: PromotionCommand): string {
  assertPromotionCommand(input);
  return canonicalize({version:PROMOTION_COMMAND_VERSION, ...input, commandType:input.commandType, toState:commandTargetState(input.commandType)});
}

export function promotionCommandHash(input: PromotionCommand): string {
  return crypto.createHash('sha256').update(canonicalPromotionCommand(input)).digest('hex');
}

export function commandEnvelope(input: PromotionCommand) {
  return { ...input, version: PROMOTION_COMMAND_VERSION, toState: commandTargetState(input.commandType), commandHash: promotionCommandHash(input) };
}
