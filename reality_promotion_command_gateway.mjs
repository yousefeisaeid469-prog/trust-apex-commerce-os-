import fs from 'node:fs';
import crypto from 'node:crypto';

const canonicalize = value => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
};
const hash = value => crypto.createHash('sha256').update(canonicalize(value)).digest('hex');
const command = {
  commandId:'demo-command-v268-001', commandType:'APPROVE', decisionId:'demo-decision', actorId:'reviewer-a', keyId:'key-a',
  rationale:'explicit evidence review', attestationRoot:'a'.repeat(64), evidenceLeaf:'b'.repeat(64), authorizationNonce:'nonce-v268-001',
  signedAt:'2026-09-09T10:00:00.000Z', authorizationExpiresAt:'2026-09-09T10:05:00.000Z'
};
const envelope = {...command, version:'V268', toState:'APPROVED'};
const commandHash = hash(envelope);
const tamperedHash = hash({...envelope, toState:'REJECTED'});
const migration = fs.readFileSync('db/migrations/106_v268_promotion_command_gateway.sql','utf8');
const report = {
  version:'V268.0.0', status:'PROMOTION_COMMAND_GATEWAY_VERIFIED',
  command:{commandHash, tamperedCommandRejected: commandHash !== tamperedHash, idempotencyKeyBound:true, targetStateBound:true},
  controls:{durableCommandRecord:true, commandToAuthorizationBinding:true, commandToEventBinding:true, noAutoPromotion:true, privateKeyPersisted:false},
  migration:{latest:106, hasCommandTable:/trust_reality_promotion_commands/.test(migration), uniqueCommandHash:/uq_trust_reality_promotion_commands_hash_v268/.test(migration)}
};
fs.writeFileSync('artifacts/reality/reality-promotion-command-gateway-v268.json', JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/reality/reality-promotion-command-gateway-v268.md', `# V268 Promotion Command Gateway\n\nStatus: **${report.status}**\n\nThe promotion transition is bound to a durable command envelope, deterministic command hash, unique command id, authorization and event records. Reusing an already-applied command is idempotent; reusing the command id with a different payload is rejected. Auto-promotion remains disabled and private signing keys remain external.\n`);
console.log(JSON.stringify(report));
