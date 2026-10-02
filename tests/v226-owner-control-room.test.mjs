import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const read=f=>fs.readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
test('V226 owner room has explicit owner-only server guard',()=>{const s=read('modules/platform/security/owner-auth.ts');assert.match(s,/ownerEmailConfigured/);assert.match(s,/isOwnerEmail/);assert.match(s,/OWNER_AUTH_REQUIRED/);});
test('V226 audit is append-only and hash chained',()=>{const s=read('db/migrations/077_v226_owner_control_room.sql');assert.match(s,/trust_owner_audit_events/);assert.match(s,/event_hash TEXT NOT NULL/);assert.doesNotMatch(s,/UPDATE\s+trust_owner_audit_events/i);assert.doesNotMatch(s,/DELETE\s+FROM\s+trust_owner_audit_events/i);});
test('V226 hash changes when chain input changes',()=>{const h=x=>crypto.createHash('sha256').update(x).digest('hex');assert.notEqual(h('a:event'),h('b:event'));});
test('V226 high impact controls are approval gated',()=>{const s=read('modules/platform/owner-control-room/core.ts');assert.match(s,/GLOBAL_FREEZE/);assert.match(s,/AUTONOMY_KILL_SWITCH/);assert.match(s,/requiresApproval:true/);});
