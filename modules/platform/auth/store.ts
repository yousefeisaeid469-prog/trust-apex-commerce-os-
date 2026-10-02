import type { UserAccount, UserRole, SessionRecord } from '../../../modules/identity/core/types';
import { hashPassword, verifyPassword } from './password';
import { query } from '../db/postgres';

type StoredUser = UserAccount & { passwordHash: string };

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const rowToUser = (row: any): StoredUser => ({
  id: String(row.id),
  email: String(row.email),
  role: row.role as UserRole,
  status: row.status,
  merchantId: row.merchant_id ?? undefined,
  createdAt: new Date(row.created_at).toISOString(),
  passwordHash: String(row.password_hash),
});
const sanitizeUser = (user: StoredUser): UserAccount => {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
};

/** Durable identity store. Production auth never falls back to process memory. */
export async function registerUser(input: { email: string; password: string; role?: UserRole }) {
  const email = normalizeEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Invalid email');
  if (input.password.length < 10) throw new Error('Password must be at least 10 characters');
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await query(
      `insert into trust_users(email,password_hash,role,status)
       values($1,$2,$3,'active')
       returning id,email,password_hash,role,status,merchant_id,created_at`,
      [email, passwordHash, input.role ?? 'customer'],
    );
    return sanitizeUser(rowToUser(result.rows[0]));
  } catch (error: any) {
    if (error?.code === '23505') throw new Error('Account already exists');
    throw error;
  }
}

export async function authenticateUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const result = await query(`select id,email,password_hash,role,status,merchant_id,created_at from trust_users where email=$1 limit 1`, [email]);
  const row = result.rows[0];
  if (!row) return undefined;
  const user = rowToUser(row);
  if (user.status !== 'active' || !(await verifyPassword(password, user.passwordHash))) return undefined;
  return sanitizeUser(user);
}

export async function createSession(userId: string, ttlMs = 1000 * 60 * 60 * 24 * 30): Promise<SessionRecord> {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const result = await query(
    `insert into trust_sessions(user_id,expires_at) values($1,$2) returning id,user_id,created_at,expires_at,revoked_at`,
    [userId, expiresAt],
  );
  const row = result.rows[0];
  return { id: String(row.id), userId: String(row.user_id), createdAt: new Date(row.created_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString(), revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined };
}

export async function getUserById(userId: string) {
  const result = await query(`select id,email,password_hash,role,status,merchant_id,created_at from trust_users where id=$1 limit 1`, [userId]);
  return result.rows[0] ? sanitizeUser(rowToUser(result.rows[0])) : undefined;
}

export async function updateUser(userId: string, patch: Partial<Pick<UserAccount, 'role' | 'status' | 'merchantId'>>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (patch.role !== undefined) { values.push(patch.role); fields.push(`role=$${values.length}`); }
  if (patch.status !== undefined) { values.push(patch.status); fields.push(`status=$${values.length}`); }
  if (patch.merchantId !== undefined) { values.push(patch.merchantId); fields.push(`merchant_id=$${values.length}`); }
  if (!fields.length) return getUserById(userId);
  values.push(userId);
  const result = await query(`update trust_users set ${fields.join(',')},updated_at=now() where id=$${values.length} returning id,email,password_hash,role,status,merchant_id,created_at`, values);
  return result.rows[0] ? sanitizeUser(rowToUser(result.rows[0])) : undefined;
}

export async function getUserBySession(sessionId: string) {
  const result = await query(
    `select u.id,u.email,u.password_hash,u.role,u.status,u.merchant_id,u.created_at
       from trust_sessions s join trust_users u on u.id=s.user_id
      where s.id=$1 and s.revoked_at is null and s.expires_at>now() and u.status='active' limit 1`,
    [sessionId],
  );
  return result.rows[0] ? sanitizeUser(rowToUser(result.rows[0])) : undefined;
}

export async function revokeSession(sessionId: string) {
  await query(`update trust_sessions set revoked_at=now() where id=$1 and revoked_at is null`, [sessionId]);
}

export async function getSession(sessionId: string): Promise<SessionRecord | undefined> {
  const result = await query(`select id,user_id,created_at,expires_at,revoked_at from trust_sessions where id=$1 limit 1`, [sessionId]);
  const row = result.rows[0];
  return row ? { id:String(row.id), userId:String(row.user_id), createdAt:new Date(row.created_at).toISOString(), expiresAt:new Date(row.expires_at).toISOString(), revokedAt:row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined } : undefined;
}

export async function getAuthStats() {
  const result = await query(`select count(*)::int as users, count(*) filter (where status='active')::int as active_users from trust_users`);
  const sessions = await query(`select count(*)::int as active_sessions from trust_sessions where revoked_at is null and expires_at>now()`);
  return { users: result.rows[0]?.users ?? 0, activeUsers: result.rows[0]?.active_users ?? 0, activeSessions: sessions.rows[0]?.active_sessions ?? 0, persistence: 'postgres' as const };
}
