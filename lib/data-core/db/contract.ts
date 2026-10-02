export type SqlClient = {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<{ rows: T[] }>;
};

export type Transaction = {
  run<T>(work: (client: SqlClient) => Promise<T>): Promise<T>;
};

export interface ProductionStore {
  transaction: Transaction;
  health(): Promise<{ connected: boolean; latencyMs: number }>;
}

/** Adapter contract for PostgreSQL/Neon/Supabase/etc. The app stays provider-agnostic. */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return url;
}
