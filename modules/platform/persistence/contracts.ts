export type EntityId = string;

export interface Repository<T extends { id: EntityId }> {
  get(id: EntityId): Promise<T | undefined>;
  list(): Promise<T[]>;
  create(entity: T): Promise<T>;
}

export interface InventoryRepository {
  getStock(productId: EntityId): Promise<number | undefined>;
  reserve(productId: EntityId, quantity: number): Promise<boolean>;
}

export interface IdempotencyStore {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown, ttlMs: number): Promise<void>;
}
