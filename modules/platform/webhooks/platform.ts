export type WebhookEvent = { id: string; provider: string; type: string; tenantId: string; occurredAt: string; payload: unknown; sequence?: number };
export type WebhookDecision = 'accepted' | 'duplicate' | 'replay-rejected' | 'out-of-order';
export type WebhookPolicy = { replayWindowMs: number; enforceSequence: boolean };

export function validateWebhookEvent(event: WebhookEvent, now = Date.now(), policy: WebhookPolicy): WebhookDecision {
  const occurred = Date.parse(event.occurredAt);
  if (!Number.isFinite(occurred) || now - occurred > policy.replayWindowMs || occurred - now > policy.replayWindowMs) return 'replay-rejected';
  if (policy.enforceSequence && event.sequence !== undefined && event.sequence < 1) return 'out-of-order';
  return 'accepted';
}
