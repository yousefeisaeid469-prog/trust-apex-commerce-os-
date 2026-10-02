import { createHash } from 'node:crypto';
import type { CellId } from './context.ts';
import { getCellDefinition } from './registry.ts';

export function cellForTenant(tenantId: string, cellCount = Number(process.env.TRUST_CELL_COUNT ?? 1)): CellId {
  if (!tenantId || !Number.isInteger(cellCount) || cellCount < 1 || cellCount > 10_000) throw new Error('INVALID_CELL_ROUTING_CONFIG');
  const digest = createHash('sha256').update(tenantId).digest();
  const bucket = digest.readUInt32BE(0) % cellCount;
  return `cell-${String(bucket).padStart(3, '0')}`;
}

export function databaseUrlForCell(cellId: CellId): string | undefined {
  return getCellDefinition(cellId).databaseUrl ?? process.env.DATABASE_URL;
}
