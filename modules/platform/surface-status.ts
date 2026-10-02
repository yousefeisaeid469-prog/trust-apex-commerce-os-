export type SurfaceStatus =
  | 'LIVE'
  | 'FOUNDATION'
  | 'SIMULATION'
  | 'PROVIDER_REQUIRED'
  | 'DEGRADED'
  | 'ERROR';

export const SURFACE_STATUSES = [
  'LIVE',
  'FOUNDATION',
  'SIMULATION',
  'PROVIDER_REQUIRED',
  'DEGRADED',
  'ERROR',
] as const;

export function isSurfaceStatus(value: unknown): value is SurfaceStatus {
  return typeof value === 'string' && (SURFACE_STATUSES as readonly string[]).includes(value);
}

export function surfacePayload<T extends Record<string, unknown>>(
  status: SurfaceStatus,
  payload: T,
): T & { surfaceStatus: SurfaceStatus } {
  return { ...payload, surfaceStatus: status };
}
