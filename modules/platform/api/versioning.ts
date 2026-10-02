export type ApiVersion = 'v1' | 'v2';
export const CURRENT_API_VERSION: ApiVersion = 'v1';
export const SUPPORTED_API_VERSIONS: readonly ApiVersion[] = ['v1'];

export function parseApiVersion(pathname: string, header?: string | null): ApiVersion {
  const match = pathname.match(/^\/api\/(v\d+)(?:\/|$)/i);
  const candidate = (match?.[1] ?? header ?? CURRENT_API_VERSION).toLowerCase();
  if (!SUPPORTED_API_VERSIONS.includes(candidate as ApiVersion)) throw new Error('UNSUPPORTED_API_VERSION');
  return candidate as ApiVersion;
}

export function apiVersionHeaders(version: ApiVersion) {
  return {
    'X-Trust-API-Version': version,
    'X-Trust-API-Supported': SUPPORTED_API_VERSIONS.join(','),
  };
}
