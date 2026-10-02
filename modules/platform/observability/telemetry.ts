export type TelemetryLevel = 'info' | 'warn' | 'error' | 'critical';
export type TelemetryEvent = { name: string; level: TelemetryLevel; service: string; timestamp: string; durationMs?: number; metadata?: Record<string, unknown> };

const events: TelemetryEvent[] = [];
const MAX_EVENTS = 500;

export function recordTelemetry(event: Omit<TelemetryEvent, 'timestamp'>) {
  const item = { ...event, timestamp: new Date().toISOString() };
  events.push(item);
  if (events.length > MAX_EVENTS) events.shift();
  if (item.level === 'error' || item.level === 'critical') console.error('[TRUST TELEMETRY]', JSON.stringify(item));
  return item;
}

export function telemetrySnapshot() {
  const last = events.slice(-100);
  return { ok: true, service: 'trust-apex-os', generatedAt: new Date().toISOString(), counts: last.reduce<Record<string, number>>((a, e) => { a[e.level] = (a[e.level] || 0) + 1; return a; }, {}), events: last };
}

export async function notifyIncident(payload: { severity: TelemetryLevel; title: string; details?: Record<string, unknown> }) {
  const url = process.env.TRUST_INCIDENT_WEBHOOK_URL;
  if (!url) return { delivered: false, reason: 'NOT_CONFIGURED' as const };
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'trust-apex-os', ...payload, timestamp: new Date().toISOString() }) });
    return { delivered: res.ok, status: res.status };
  } catch { return { delivered: false, reason: 'DELIVERY_FAILED' as const }; }
}
