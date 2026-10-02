import type { PoolClient } from 'pg';
import { query } from '../../platform/db/postgres';
import type { GuestInfo } from '../transactions/guest-validation';

export type FraudCheckInput = {
  customerId?: string;
  guest?: GuestInfo;
  paymentMethod: 'cod' | 'card';
  total: number;
  lineCount: number;
  shipping: number;
};

// Deterministic, inspectable rules — not a black-box model. Each rule is a
// named function so a reviewer can see exactly what triggers a score. That's
// what "explainable" fraud detection means at this stage: a learned model
// needs order volume this platform doesn't have yet, and a wrong ML call
// with no track record to calibrate against is worse than a clear rule.
type Rule = { code: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; score: number; test: (i: FraudCheckInput, ctx: { recentGuestOrders: number }) => boolean };

const RULES: Rule[] = [
  { code: 'HIGH_VALUE_COD', severity: 'MEDIUM', score: 30, test: i => i.paymentMethod === 'cod' && i.total > 5000 },
  { code: 'GUEST_HIGH_VALUE', severity: 'MEDIUM', score: 25, test: i => !i.customerId && i.total > 3000 },
  { code: 'GUEST_REPEAT_VELOCITY', severity: 'HIGH', score: 45, test: (i, ctx) => !i.customerId && ctx.recentGuestOrders >= 3 },
  { code: 'LARGE_BASKET', severity: 'LOW', score: 10, test: i => i.lineCount >= 15 },
  { code: 'ZERO_SHIPPING_HIGH_VALUE', severity: 'LOW', score: 10, test: i => i.shipping === 0 && i.total > 8000 },
];

// Runs inside the checkout transaction so signals are recorded atomically
// with the order — never a separate best-effort call that could be lost on
// a crash between "order committed" and "signal recorded". This never
// blocks or fails checkout: signals are advisory (surfaced to admin review
// below), not an auto-reject gate — a wrong auto-block on a platform with
// no fraud history yet would cost more in lost legitimate guest orders than
// it would ever save.
export async function evaluateFraudSignalsTx(client: PoolClient, orderId: string, input: FraudCheckInput) {
  let recentGuestOrders = 0;
  if (!input.customerId && input.guest?.phone) {
    const r = await client.query<{ count: string }>(
      `select count(*) from trust_orders where guest_phone = $1 and created_at > now() - interval '24 hours'`,
      [input.guest.phone]
    );
    recentGuestOrders = Number(r.rows[0]?.count ?? 0);
  }
  const triggered = RULES.filter(rule => rule.test(input, { recentGuestOrders }));
  for (const rule of triggered) {
    await client.query(
      `insert into trust_fraud_signals(order_id,rule_code,severity,score,details) values($1,$2,$3,$4,$5::jsonb)`,
      [orderId, rule.code, rule.severity, rule.score, JSON.stringify({ total: input.total, paymentMethod: input.paymentMethod, lineCount: input.lineCount })]
    );
  }
  return { triggered: triggered.map(r => r.code), totalScore: triggered.reduce((s, r) => s + r.score, 0) };
}

export async function listOpenFraudSignals(limit = 50) {
  const r = await query(
    `select s.id, s.order_id, s.rule_code, s.severity, s.score, s.details, s.created_at,
            o.total, o.payment_method, o.guest_name, o.guest_phone, o.customer_id
     from trust_fraud_signals s join trust_orders o on o.id = s.order_id
     where s.status = 'OPEN' order by s.score desc, s.created_at desc limit $1`,
    [Math.min(200, Math.max(1, limit))]
  );
  return r.rows;
}

export async function reviewFraudSignal(signalId: string, decision: 'REVIEWED_OK' | 'REVIEWED_BLOCKED', reviewedBy: string) {
  const r = await query(
    `update trust_fraud_signals set status=$2, reviewed_by=$3, reviewed_at=now() where id=$1 and status='OPEN' returning id`,
    [signalId, decision, reviewedBy]
  );
  if (!r.rows[0]) throw new Error('SIGNAL_NOT_FOUND_OR_ALREADY_REVIEWED');
  return { reviewed: true };
}

export async function orderFraudSignals(orderId: string) {
  const r = await query(`select id,rule_code,severity,score,status,created_at from trust_fraud_signals where order_id=$1 order by created_at desc`, [orderId]);
  return r.rows;
}
