import { productionConfigCheck } from '../config/env.ts';

export type SecurityCheckStatus = 'PASS' | 'WARN' | 'FAIL';
export type SecurityCheck = { id: string; status: SecurityCheckStatus; detail: string };

export function assessProductionSecurity(): { ready: boolean; checks: SecurityCheck[] } {
  const configured = productionConfigCheck();
  const checks: SecurityCheck[] = [
    { id: 'SEC-ENV-001', status: configured.ok ? 'PASS' : 'FAIL', detail: configured.ok ? 'Required production secrets are configured.' : `Missing: ${configured.missing.join(', ')}` },
    { id: 'SEC-DB-001', status: databaseTLSConfigured() ? 'PASS' : (configured.environment === 'production' ? 'FAIL' : 'WARN'), detail: databaseTLSConfigured() ? 'Database transport encryption is explicitly configured.' : 'Set sslmode=require in DATABASE_URL or TRUST_DB_SSL=true for production.' },
    { id: 'SEC-KEY-001', status: process.env.TRUST_FIELD_ENCRYPTION_KEY ? 'PASS' : (configured.environment === 'production' ? 'FAIL' : 'WARN'), detail: process.env.TRUST_FIELD_ENCRYPTION_KEY ? 'Field-encryption key is configured server-side.' : 'Sensitive-field encryption key is not configured.' },
    { id: 'SEC-CORS-001', status: process.env.TRUST_ALLOWED_ORIGINS ? 'PASS' : (configured.environment === 'production' ? 'FAIL' : 'WARN'), detail: process.env.TRUST_ALLOWED_ORIGINS ? 'Explicit API origins configured.' : 'Production should use an explicit TRUST_ALLOWED_ORIGINS allowlist.' },
    { id: 'SEC-RATE-001', status: process.env.TRUST_RATE_LIMIT_BACKEND === 'shared' ? 'PASS' : (configured.environment === 'production' ? 'FAIL' : 'WARN'), detail: process.env.TRUST_RATE_LIMIT_BACKEND === 'shared' ? 'Shared/distributed rate-limit backend is declared.' : 'Production should declare TRUST_RATE_LIMIT_BACKEND=shared and inject a shared rate-limit store; in-memory buckets do not protect horizontally scaled nodes.' },
  ];
  return { ready: checks.every(c => c.status !== 'FAIL'), checks };
}

export function databaseTLSConfigured() {
  const url = process.env.DATABASE_URL ?? '';
  return process.env.TRUST_DB_SSL === 'true' || /[?&]sslmode=require(?:&|$)/i.test(url) || /[?&]sslmode=verify-full(?:&|$)/i.test(url);
}
