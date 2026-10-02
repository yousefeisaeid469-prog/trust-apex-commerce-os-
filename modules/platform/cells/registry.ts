import type { CellId } from './context.ts';

export interface CellDefinition {
  id: CellId;
  databaseUrl?: string;
  region?: string;
  enabled: boolean;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  return value.toLowerCase() === 'true';
}

export function getCellDefinition(cellId: CellId): CellDefinition {
  const prefix = `TRUST_CELL_${cellId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  return {
    id: cellId,
    databaseUrl: process.env[`${prefix}_DATABASE_URL`],
    region: process.env[`${prefix}_REGION`],
    enabled: parseBoolean(process.env[`${prefix}_ENABLED`], true),
  };
}

export function listConfiguredCells(): CellDefinition[] {
  const ids = new Set<string>([process.env.TRUST_DEFAULT_CELL ?? 'cell-000']);
  for (const key of Object.keys(process.env)) {
    const match = /^TRUST_CELL_([A-Z0-9_]+)_DATABASE_URL$/.exec(key);
    if (match) ids.add(match[1].toLowerCase().replace(/_/g, '-'));
  }
  return [...ids].map(getCellDefinition);
}
