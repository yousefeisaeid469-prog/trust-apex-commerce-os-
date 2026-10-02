import { runVerifiedCommerceRecovery } from '../modules/platform/durable-events/recovery-loop.ts';
const result = await runVerifiedCommerceRecovery(process.env.TRUST_RECOVERY_TRIGGER || 'standalone');
console.log(JSON.stringify({ runKey: result.runKey, verified: result.verified, before: result.before.state, after: result.after.state, steps: result.steps }, null, 2));
if (!result.verified) process.exit(2);
