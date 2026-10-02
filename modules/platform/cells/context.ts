import { AsyncLocalStorage } from 'node:async_hooks';

export type CellId = string;

export interface CellExecutionContext {
  cellId: CellId;
  requestId?: string;
}

const storage = new AsyncLocalStorage<CellExecutionContext>();

export function getCellContext(): CellExecutionContext | undefined {
  return storage.getStore();
}

export function getCurrentCellId(): CellId {
  return storage.getStore()?.cellId ?? process.env.TRUST_DEFAULT_CELL ?? 'cell-000';
}

export async function runInCell<T>(cellId: CellId, work: () => Promise<T>, requestId?: string): Promise<T> {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(cellId)) throw new Error('INVALID_CELL_ID');
  return storage.run({ cellId, requestId }, work);
}
