import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { databaseUrlForCell, getCurrentCellId } from '../cells/index.ts';

const pools = new Map<string, Pool>();

function getPool() {
  const cellId = getCurrentCellId();
  const connectionString = databaseUrlForCell(cellId);
  if (!connectionString) return undefined;
  let p = pools.get(cellId);
  if (!p) {
    p = new Pool({
      connectionString,
      application_name: process.env.TRUST_DB_APPLICATION_NAME ?? `trust-apex-os-${cellId}`,
      ...(process.env.TRUST_DB_SSL === 'true' ? { ssl: { rejectUnauthorized: process.env.TRUST_DB_SSL_REJECT_UNAUTHORIZED !== 'false' } } : {}),
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: Number(process.env.TRUST_DB_STATEMENT_TIMEOUT_MS ?? 15_000),
      query_timeout: Number(process.env.TRUST_DB_QUERY_TIMEOUT_MS ?? 20_000),
    });
    pools.set(cellId, p);
  }
  return p;
}

export function databaseConfigured() { return Boolean(databaseUrlForCell(getCurrentCellId())); }

export async function withPgTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = getPool();
  if (!p) throw new Error('DATABASE_NOT_CONFIGURED');
  const client = await p.connect();
  try { await client.query('begin'); const result = await work(client); await client.query('commit'); return result; }
  catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}

export async function closePostgresPool() {
  const active = [...pools.values()]; pools.clear(); await Promise.all(active.map(p => p.end()));
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: readonly unknown[] = []) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_NOT_CONFIGURED');
  return p.query<T>(sql, params);
}
