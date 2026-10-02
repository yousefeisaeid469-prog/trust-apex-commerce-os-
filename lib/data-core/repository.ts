import { EntityMeta } from './types';

export interface Repository<T extends EntityMeta> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  put(value: T): Promise<T>;
  remove(id: string): Promise<boolean>;
}

export class InMemoryRepository<T extends EntityMeta> implements Repository<T> {
  private store = new Map<string, T>();
  constructor(seed: T[] = []) { seed.forEach(x => this.store.set(x.id, x)); }
  async list() { return [...this.store.values()].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async get(id: string) { return this.store.get(id) ?? null; }
  async put(value: T) { this.store.set(value.id, value); return value; }
  async remove(id: string) { return this.store.delete(id); }
}

export function entityMeta(id: string, now = new Date().toISOString(), version = 1): EntityMeta {
  return { id, createdAt: now, updatedAt: now, version };
}
