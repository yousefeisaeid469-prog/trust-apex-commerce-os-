export type ConciergeAuditEvent = {
  event: 'MISSION_STARTED' | 'RECOMMENDATIONS_SHOWN' | 'COMPARE_OPENED' | 'VISION_STARTED';
  sessionId: string;
  consented: boolean;
  createdAt: string;
};

export function buildAuditEvent(event: ConciergeAuditEvent['event'], sessionId: string, consented: boolean): ConciergeAuditEvent {
  return { event, sessionId, consented, createdAt: new Date().toISOString() };
}
