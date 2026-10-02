export type HealthState = 'healthy' | 'degraded' | 'unavailable';
export type HealthCheck = { name: string; state: HealthState; latencyMs: number; detail?: string };

export function aggregateHealth(checks: HealthCheck[]): { state: HealthState; checks: HealthCheck[] } {
  if (checks.some((c) => c.state === 'unavailable')) return { state: 'unavailable', checks };
  if (checks.some((c) => c.state === 'degraded')) return { state: 'degraded', checks };
  return { state: 'healthy', checks };
}
