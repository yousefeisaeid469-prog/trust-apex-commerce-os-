import type { IdempotencyStore, InventoryRepository, Repository } from './contracts';

export class MemoryRepository<T extends { id: string }> implements Repository<T> {
  private readonly rows = new Map<string, T>();
  constructor(seed: T[] = []) { for (const row of seed) this.rows.set(row.id, row); }
  async get(id: string) { return this.rows.get(id); }
  async list() { return [...this.rows.values()]; }
  async create(entity: T) { if (this.rows.has(entity.id)) throw new Error('Entity already exists'); this.rows.set(entity.id, entity); return entity; }
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly rows = new Map<string, { value: unknown; expiresAt: number }>();
  async get(key: string) { const row = this.rows.get(key); if (!row) return undefined; if (row.expiresAt <= Date.now()) { this.rows.delete(key); return undefined; } return row.value; }
  async set(key: string, value: unknown, ttlMs: number) { this.rows.set(key, { value, expiresAt: Date.now() + Math.max(1000, ttlMs) }); }
}
