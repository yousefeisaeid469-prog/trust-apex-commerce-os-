import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V230 notification center is authenticated and database-backed',()=>{
  const route=fs.readFileSync('app/api/notifications/route.ts','utf8');
  assert.match(route,/getCurrentUser/);
  assert.match(route,/AUTH_REQUIRED/);
  assert.match(route,/platform_notifications/);
  assert.match(route,/recipient_id=\$2/);
  assert.match(route,/setPreference/);
  const core=fs.readFileSync('modules/platform/notifications-3/core.ts','utf8');
  assert.match(core,/read_at/);
  const migration=fs.readFileSync('db/migrations/080_v230_notification_center.sql','utf8');
  assert.match(migration,/ADD COLUMN IF NOT EXISTS read_at/);
});

test('V230 public registration cannot self-assign privileged roles',()=>{
  const route=fs.readFileSync('app/api/auth/register/route.ts','utf8');
  assert.match(route,/role:\s*'customer'/);
  assert.doesNotMatch(route,/role:\s*String\(body\?\.role/);
});

test('V230 auth me awaits durable session lookup',()=>{
  const route=fs.readFileSync('app/api/auth/me/route.ts','utf8');
  assert.match(route,/await getUserBySession/);
});
